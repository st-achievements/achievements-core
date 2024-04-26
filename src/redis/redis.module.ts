import { Module } from '@nestjs/common';
import { formatZodErrorString, StApiName } from '@st-api/core';
import { defineSecret } from 'firebase-functions/params';
import { Redis } from 'ioredis';
import { z } from 'zod';

import { INVALID_REDIS_CREDENTIALS } from '../exceptions.js';

export const REDIS_CREDENTIALS: ReturnType<typeof defineSecret> =
  defineSecret('REDIS_CREDENTIALS');

const RedisCredentialsSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => JSON.parse(value))
  .pipe(
    z.object({
      host: z.string().trim().min(1),
      password: z.string().trim().min(1),
      port: z.number().safe().int().positive(),
    }),
  );

@Module({
  exports: [Redis],
  providers: [
    {
      provide: Redis,
      useFactory: (apiName: string) => {
        const result = RedisCredentialsSchema.safeParse(
          REDIS_CREDENTIALS.value(),
        );
        if (!result.success) {
          throw INVALID_REDIS_CREDENTIALS(formatZodErrorString(result.error));
        }
        const { password, host, port } = result.data;
        return new Redis({
          password,
          host,
          port,
          commandTimeout: 5000,
          lazyConnect: true,
          connectionName: apiName,
        });
      },
      inject: [StApiName],
    },
  ],
})
export class RedisModule {}
