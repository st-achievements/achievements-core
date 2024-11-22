import { HandlerContext } from '@st-api/core';
import { AuthContext } from './auth.schema.js';

export abstract class AuthenticationStrategy {
  abstract authenticate(context: HandlerContext): Promise<AuthContext>;
}
