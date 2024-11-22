import { Injectable } from '@stlmpp/di';
import { AuthenticationStrategy } from './authentication.strategy.js';
import { HandlerContext } from '@st-api/core';
import { AuthContext } from './auth.schema.js';
import { Drizzle, iam, usr } from '@st-achievements/database';
import { GLOBAL_SALT_SECRET } from './global-salt.secret.js';
import bcrypt from 'bcrypt';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { UNAUTHORIZED } from '../exceptions.js';

@Injectable()
export class ApiKeyAuthenticationService extends AuthenticationStrategy {
  constructor(private readonly drizzle: Drizzle) {
    super();
  }

  async authenticate(context: HandlerContext): Promise<AuthContext> {
    const apiKey = context.headers['x-api-key']
      ? String(context.headers['x-api-key'])
      : undefined;
    if (!apiKey) {
      throw UNAUTHORIZED();
    }
    const globalSalt = GLOBAL_SALT_SECRET.value();
    const apiKeyHashed = await bcrypt.hash(apiKey, globalSalt);
    const [user] = await this.drizzle
      .select({
        userId: usr.user.id,
        externalId: usr.user.externalId,
        username: usr.user.name,
      })
      .from(iam.apiKey)
      .innerJoin(usr.user, eq(iam.apiKey.userId, usr.user.id))
      .where(
        and(eq(iam.apiKey.key, apiKeyHashed), isNull(iam.apiKey.inactivatedAt)),
      )
      .orderBy(desc(iam.apiKey.id))
      .limit(1);

    if (!user) {
      throw UNAUTHORIZED();
    }

    return {
      externalId: user.externalId ?? undefined,
      username: user.username,
      userId: user.userId,
    };
  }
}
