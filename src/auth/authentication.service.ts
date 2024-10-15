import { Drizzle, usr } from '@st-achievements/database';
import { safeAsync } from '@st-api/core';
import { FirebaseAdminAuth, isEmulator, Logger } from '@st-api/firebase';
import { eq, InferSelectModel } from 'drizzle-orm';

import {
  UNAUTHORIZED,
  USER_IS_NOT_THE_SAME_AS_AUTHORIZED,
  USER_NOT_CREATED,
} from '../exceptions.js';

import { AuthContext } from './auth.schema.js';
import { getAuthContext } from './get-auth-context.js';
import { Injectable } from '@stlmpp/di';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly drizzle: Drizzle,
    private readonly firebaseAdminAuth: FirebaseAdminAuth,
  ) {}

  private readonly logger = Logger.create(this);
  private readonly cache = new Map<
    string,
    Pick<InferSelectModel<typeof usr.user>, 'id' | 'name' | 'externalId'>
  >();

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

  async authenticate(token: string): Promise<AuthContext> {
    const [error, userFirebase] = await safeAsync(() =>
      this.firebaseAdminAuth.verifyIdToken(token),
    );
    if (error) {
      this.logger.info('Response from firebase admin', { error });
      throw UNAUTHORIZED();
    }
    const user =
      this.cache.get(userFirebase.uid) ??
      (await this.drizzle.query.usrUser.findFirst({
        columns: {
          id: true,
          externalId: true,
          name: true,
        },
        where: eq(usr.user.externalId, userFirebase.uid),
      }));
    if (!user) {
      this.logger.warn(
        'The user already exists on firebase, but it does not exists in the database',
      );
      throw USER_NOT_CREATED();
    }
    return {
      userId: user.id,
      externalId: userFirebase.uid,
      username: user.name,
    };
  }
}
