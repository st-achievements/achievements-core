import { Injectable } from '@stlmpp/di';
import { AuthenticationStrategy } from './authentication.strategy.js';
import { HandlerContext, safeAsync } from '@st-api/core';
import { AuthContext } from './auth.schema.js';
import {
  MISSING_AUTHORIZATION_HEADER,
  UNAUTHORIZED,
  USER_NOT_CREATED,
} from '../exceptions.js';
import { Drizzle, usr } from '@st-achievements/database';
import { FirebaseAdminAuth, Logger } from '@st-api/firebase';
import { eq, InferSelectModel } from 'drizzle-orm';

@Injectable()
export class JwtAuthenticationService extends AuthenticationStrategy {
  constructor(
    private readonly drizzle: Drizzle,
    private readonly firebaseAdminAuth: FirebaseAdminAuth,
  ) {
    super();
  }

  private readonly logger = Logger.create(this);
  private readonly cache = new Map<
    string,
    Pick<InferSelectModel<typeof usr.user>, 'id' | 'name' | 'externalId'>
  >();

  async authenticate(context: HandlerContext): Promise<AuthContext> {
    const authorization = context.headers.authorization
      ? String(context.headers.authorization)
      : undefined;
    if (!authorization) {
      throw MISSING_AUTHORIZATION_HEADER();
    }
    const token = authorization.trim().replace('Bearer ', '');
    const [error, userFirebase] = await safeAsync(() =>
      this.firebaseAdminAuth.verifyIdToken(token),
    );
    if (error) {
      this.logger.debug('Response from firebase admin', { error });
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
