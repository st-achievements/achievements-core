import { DynamicModule, Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ParamIntSchema,
  Throttler,
  ThrottlerGuard,
  ThrottlerOptionsToken,
} from '@st-api/core';
import {
  FirebaseAdminModule,
  FirebaseModule,
  isEmulator,
  PubSubModule,
} from '@st-api/firebase';
import { z } from 'zod';

import { AuthenticationGuard } from './auth/authentication.guard.js';
import { EventarcController } from './eventarc/eventarc.controller.js';
import { EventarcService } from './eventarc/eventarc.service.js';
import { FirebaseFunctionsController } from './firebase-functions/firebase-functions.controller.js';
import { FirebaseFunctionsService } from './firebase-functions/firebase-functions.service.js';
import { PubSubController } from './pub-sub/pub-sub.controller.js';
import { PubSubService } from './pub-sub/pub-sub.service.js';
import { RedisThrottler } from './redis/redis-throttler.js';
import { RedisModule } from './redis/redis.module.js';

const THROTTLER_OPTIONS_DEFAULT = z
  .object({
    limit: ParamIntSchema.catch(() => 100),
    ttl: ParamIntSchema.catch(() => 60 * 1000),
  })
  .parse({
    limit: process.env.ACH_THROTTLER_LIMIT,
    ttl: process.env.ACH_THROTTLER_TTL,
  });

export interface AchievementsCoreOptions {
  authentication: boolean;
  throttling: boolean;
}

@Module({})
export class AchievementsCoreModule {
  static forRoot(options: AchievementsCoreOptions): DynamicModule {
    const controllers: DynamicModule['controllers'] = [];
    if (isEmulator()) {
      controllers.push(
        PubSubController,
        EventarcController,
        FirebaseFunctionsController,
      );
    }
    const providers: Provider[] = [
      PubSubService,
      EventarcService,
      FirebaseFunctionsService,
    ];
    const imports: DynamicModule['imports'] = [
      PubSubModule,
      FirebaseAdminModule.forRoot(),
      FirebaseModule.forRoot({
        apiKey: 'AIzaSyCSIQOzFvIh-0988r0c-cuIPGqVP2jLscE',
        authDomain: 'st-achievements.firebaseapp.com',
        projectId: 'st-achievements',
        storageBucket: 'st-achievements.appspot.com',
        messagingSenderId: '984964234239',
        appId: '1:984964234239:web:647f0b73735664d622c5ca',
      }),
    ];
    const exports: DynamicModule['exports'] = [
      PubSubService,
      EventarcService,
      FirebaseFunctionsService,
      FirebaseAdminModule,
      FirebaseModule,
    ];
    if (options.throttling) {
      imports.push(RedisModule);
      exports.push(RedisModule);
      providers.push(
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: Throttler, useClass: RedisThrottler },
        { provide: ThrottlerOptionsToken, useValue: THROTTLER_OPTIONS_DEFAULT },
      );
    }
    if (options.authentication) {
      providers.push({
        provide: APP_GUARD,
        useClass: AuthenticationGuard,
      });
    }
    return {
      module: AchievementsCoreModule,
      providers,
      imports,
      exports,
      controllers,
    };
  }
}
