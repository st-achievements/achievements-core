import {
  GLOBAL_GUARDS,
  Handler,
  HonoAppOptions,
  ParamIntSchema,
  Throttler,
  ThrottlerGuard,
  ThrottlerOptionsToken,
} from '@st-api/core';
import {
  isEmulator,
  provideFirebase,
  provideFirebaseAdmin,
  providePubSub,
} from '@st-api/firebase';
import { z } from 'zod';

import { AuthenticationGuard } from './auth/authentication.guard.js';
import { AuthenticationService } from './auth/authentication.service.js';
import { EventarcController } from './eventarc/eventarc.controller.js';
import { EventarcService } from './eventarc/eventarc.service.js';
import { FirebaseFunctionsController } from './firebase-functions/firebase-functions.controller.js';
import { FirebaseFunctionsService } from './firebase-functions/firebase-functions.service.js';
import { PubSubController } from './pub-sub/pub-sub.controller.js';
import { PubSubService } from './pub-sub/pub-sub.service.js';
import { RedisThrottler } from './redis/redis-throttler.js';
import { Hono } from 'hono';
import { Class } from 'type-fest';
import { Provider } from '@stlmpp/di';

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

export function achievementsCoreModule(
  options: AchievementsCoreOptions,
): Required<Pick<HonoAppOptions<Hono>, 'providers' | 'controllers'>> {
  const controllers: Class<Handler>[] = [];
  if (isEmulator()) {
    controllers.push(
      PubSubController,
      EventarcController,
      FirebaseFunctionsController,
    );
  }
  const providers: Array<Provider | Class<any>> = [
    PubSubService,
    EventarcService,
    FirebaseFunctionsService,
    AuthenticationService,
    ...providePubSub(),
    ...provideFirebaseAdmin(),
    ...provideFirebase({
      apiKey: 'AIzaSyCSIQOzFvIh-0988r0c-cuIPGqVP2jLscE',
      authDomain: 'st-achievements.firebaseapp.com',
      projectId: 'st-achievements',
      storageBucket: 'st-achievements.appspot.com',
      messagingSenderId: '984964234239',
      appId: '1:984964234239:web:647f0b73735664d622c5ca',
    }),
  ];
  if (options.throttling) {
    providers.push(
      { provide: GLOBAL_GUARDS, useClass: ThrottlerGuard, multi: true },
      { provide: Throttler, useClass: RedisThrottler },
      { provide: ThrottlerOptionsToken, useValue: THROTTLER_OPTIONS_DEFAULT },
    );
  }
  if (options.authentication) {
    providers.push({
      provide: GLOBAL_GUARDS,
      useClass: AuthenticationGuard,
      multi: true,
    });
  }
  return {
    controllers,
    providers,
  };
}
