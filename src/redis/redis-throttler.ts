import { Inject, Injectable } from '@nestjs/common';
import {
  formatZodErrorString,
  StApiName,
  Throttler,
  ThrottlerOptionsArgs,
  TOO_MANY_REQUESTS,
} from '@st-api/core';
import { isEmulator, Logger } from '@st-api/firebase';
import { type Request, type Response } from 'express';
import { Redis } from 'ioredis';
import { z } from 'zod';

@Injectable()
export class RedisThrottler extends Throttler {
  constructor(
    private readonly redis: Redis,
    @Inject(StApiName) private readonly stApiName: string,
  ) {
    super();
  }

  private readonly scriptSrc = `
      local totalHits = redis.call("INCR", KEYS[1])
      local timeToExpire = redis.call("PTTL", KEYS[1])
      if timeToExpire <= 0
        then
          redis.call("PEXPIRE", KEYS[1], tonumber(ARGV[1]))
          timeToExpire = tonumber(ARGV[1])
        end
      return { totalHits, timeToExpire }
    `
    .replaceAll(/^\s+/gm, '')
    .trim();

  private readonly schema = z.tuple([z.number(), z.number()]);

  private readonly logger = Logger.create(this);

  async rejectOnQuotaExceededOrRecordUsage({
    context,
    ttl,
    limit,
  }: ThrottlerOptionsArgs): Promise<void> {
    if (isEmulator()) {
      this.logger.info('Skipping Throttler check because emulator is running');
      return;
    }
    const appName = this.stApiName;
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const httpAdapter = context.switchToHttp();
    const ip = httpAdapter.getRequest<Request>().ip;
    const key = `${appName}-${className}-${handlerName}-${ip}`;

    const results = await this.redis.call(
      'EVAL',
      this.scriptSrc,
      1,
      `${this.redis.options.keyPrefix || ''}${key}`,
      ttl,
    );

    const parsed = this.schema.safeParse(results);

    if (!parsed.success) {
      this.logger.warn(
        `Could not parse result from REDIS. ${formatZodErrorString(parsed.error)}`,
      );
      throw TOO_MANY_REQUESTS();
    }

    const [totalHits, timeToExpire] = parsed.data;

    const response = httpAdapter.getResponse<Response>();

    const ttlSeconds = Math.floor(ttl / 1000);
    const timeToExpireSeconds = Math.floor(timeToExpire / 1000);

    response
      .header('RateLimit-Limit', String(limit))
      .header('RateLimit-Remaining', String(Math.max(0, limit - totalHits)))
      .header('RateLimit-Reset', String(timeToExpireSeconds))
      .header('RateLimit-Policy', `${limit};w=${ttlSeconds}`);

    if (totalHits > limit) {
      response.header('Retry-After', String(timeToExpireSeconds));
      throw TOO_MANY_REQUESTS();
    }
  }
}
