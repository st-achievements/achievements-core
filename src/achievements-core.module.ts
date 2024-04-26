import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ParamIntSchema,
  Throttler,
  ThrottlerGuard,
  ThrottlerOptionsToken,
} from '@st-api/core';
import { z } from 'zod';

import { RedisModule } from './redis/redis.module.js';
import { RedisThrottler } from './redis-throttler/redis-throttler.js';

const THROTTLER_OPTIONS_DEFAULT = z
  .object({
    limit: ParamIntSchema.catch(() => 100),
    ttl: ParamIntSchema.catch(() => 60 * 1000),
  })
  .parse({
    limit: process.env.ACH_THROTTLER_LIMIT,
    ttl: process.env.ACH_THROTTLER_TTL,
  });

@Module({
  imports: [RedisModule],
  exports: [RedisModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: Throttler,
      useClass: RedisThrottler,
    },
    {
      provide: ThrottlerOptionsToken,
      useValue: THROTTLER_OPTIONS_DEFAULT,
    },
  ],
})
export class AchievementsCoreModule {}
