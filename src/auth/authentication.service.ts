import { Injectable } from '@nestjs/common';
import { Drizzle, usr } from '@st-achievements/database';
import { safeAsync } from '@st-api/core';
import { FirebaseAdminAuth, Logger } from '@st-api/firebase';
import { eq, InferSelectModel } from 'drizzle-orm';

import { UNAUTHORIZED, USER_NOT_CREATED } from '../exceptions.js';

import { AuthContext } from './auth.schema.js';

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
      this.logger.info(
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
