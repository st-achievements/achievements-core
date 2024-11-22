import { __INTERNAL_SET_GET_USER_ID_FROM_CONTEXT } from '@st-achievements/database';

import { getAuthContext } from './auth/get-auth-context.js';

__INTERNAL_SET_GET_USER_ID_FROM_CONTEXT(() => getAuthContext().userId);

export {
  AssertAuthUser,
  type AuthUserOptions,
} from './auth/assert-auth-user.decorator.js';
export { AuthContext } from './auth/auth.schema.js';
export { AuthenticationGuard } from './auth/authentication.guard.js';
export { AuthenticationService } from './auth/authentication.service.js';
export { type AuthenticationMode } from './auth/authentication-mode.type.js';
export { getAuthContext } from './auth/get-auth-context.js';
export { EventarcService } from './eventarc/eventarc.service.js';
export { FirebaseFunctionsService } from './firebase-functions/firebase-functions.service.js';
export { PubSubService } from './pub-sub/pub-sub.service.js';
export { REDIS_CREDENTIALS, provideRedis } from './redis/redis.module.js';
export {
  achievementsCoreModule,
  type AchievementsCoreOptions,
} from './achievements-core.module.js';
export { AchievementsCoreAdapter } from './achievements-core-adapter.js';
export {
  MISSING_AUTHORIZATION_HEADER,
  INVALID_REDIS_CREDENTIALS,
  USER_IS_NOT_THE_SAME_AS_AUTHORIZED,
  USER_NOT_CREATED,
  UNAUTHORIZED,
} from './exceptions.js';
