import { __INTERNAL_SET_GET_USER_ID_FROM_CONTEXT } from '@st-achievements/database';

import { getAuthContext } from './auth/get-auth-context.js';

__INTERNAL_SET_GET_USER_ID_FROM_CONTEXT(() => getAuthContext().userId);

export { AuthContext } from './auth/auth.schema.js';
export { AuthenticationGuard } from './auth/authentication.guard.js';
export { getAuthContext } from './auth/get-auth-context.js';
export { EventarcService } from './eventarc/eventarc.service.js';
export { FirebaseFunctionsService } from './firebase-functions/firebase-functions.service.js';
export { PubSubService } from './pub-sub/pub-sub.service.js';
export { REDIS_CREDENTIALS, RedisModule } from './redis/redis.module.js';
export {
  AchievementsCoreModule,
  type AchievementsCoreOptions,
} from './achievements-core.module.js';
export { AchievementsCoreAdapter } from './achievements-core-adapter.js';
export {
  MISSING_AUTHORIZATION_HEADER,
  INVALID_REDIS_CREDENTIALS,
} from './exceptions.js';
