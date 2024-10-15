import {
  formatZodErrorString,
  StApiName,
  Throttler,
  ThrottlerOptionsArgs,
  TOO_MANY_REQUESTS,
} from '@st-api/core';
import { isEmulator, Logger } from '@st-api/firebase';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { Inject, Injectable } from '@stlmpp/di';
import { getConnInfo } from '@hono/node-server/conninfo';
import crypto from 'node:crypto';

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
    const connInfo = getConnInfo(context.c);
    const uniqueKey = context.headers.authorization
      ? String(context.headers.authorization)
      : connInfo.remote.address || '-';
    const key = `${appName}-${className}-${crypto.hash('md5', uniqueKey)}`;

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

    const ttlSeconds = Math.floor(ttl / 1000);
    const timeToExpireSeconds = Math.floor(timeToExpire / 1000);

    context.c.header('');

    context.c.res.headers.set('RateLimit-Limit', String(limit));
    context.c.res.headers.set(
      'RateLimit-Remaining',
      String(Math.max(0, limit - totalHits)),
    );
    context.c.res.headers.set('RateLimit-Reset', String(timeToExpireSeconds));
    context.c.res.headers.set('RateLimit-Policy', `${limit};w=${ttlSeconds}`);

    if (totalHits > limit) {
      context.c.res.headers.set('Retry-After', String(timeToExpireSeconds));
      throw TOO_MANY_REQUESTS();
    }
  }
}
