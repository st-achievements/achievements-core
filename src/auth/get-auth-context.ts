import { getStateMetadataKey } from '@st-api/core';

import { AuthContext } from './auth.schema.js';
import { AuthorizationContextSymbol } from './authentication.guard.js';

export function getAuthContext(): AuthContext {
  const auth = getStateMetadataKey(AuthorizationContextSymbol);
  return AuthContext.parse(auth);
}
