import { usr } from '@st-achievements/database';
import { isEmulator, Logger } from '@st-api/firebase';
import { InferSelectModel } from 'drizzle-orm';

import { USER_IS_NOT_THE_SAME_AS_AUTHORIZED } from '../exceptions.js';
import { getAuthContext } from './get-auth-context.js';
import { Injectable } from '@stlmpp/di';

@Injectable()
export class AuthenticationService {
  private readonly logger = Logger.create(this);

  assertAuthenticatedUser(userId: number): void {
    if (isEmulator()) {
      this.logger.info(
        'Skipping Authenticated User assertion because emulator is running',
      );
      return;
    }
    const authContext = getAuthContext();
    this.logger.debug(
      `authContext.userId = ${authContext.userId} | userId = ${userId}`,
    );
    if (authContext.userId !== userId) {
      throw USER_IS_NOT_THE_SAME_AS_AUTHORIZED();
    }
  }
}
