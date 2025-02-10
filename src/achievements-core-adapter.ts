import {
  DATABASE_CONNECTION_STRING,
  provideDrizzle,
} from '@st-achievements/database';
import { getStateMetadata, safe } from '@st-api/core';
import {
  CallableData,
  EventarcData,
  Logger,
  StFirebaseAppAdapter,
  StFirebaseAppOptions,
} from '@st-api/firebase';
import { CloudEvent } from 'firebase-functions/v2';
import { CallableRequest } from 'firebase-functions/v2/https';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { AuthContext } from './auth/auth.schema.js';
import { AuthorizationContextSymbol } from './auth/authentication.guard.js';
import { AuthContextAttributeKey } from './constants.js';
import {
  INVALID_REDIS_CREDENTIALS,
  MISSING_API_KEY,
  MISSING_AUTHORIZATION_HEADER,
  UNAUTHORIZED,
  USER_IS_NOT_THE_SAME_AS_AUTHORIZED,
  USER_NOT_CREATED,
} from './exceptions.js';
import {
  achievementsCoreModule,
  AchievementsCoreOptions,
} from './achievements-core.module.js';
import { provideRedis, REDIS_CREDENTIALS } from './redis/redis.module.js';
import { GLOBAL_SALT_SECRET } from './auth/global-salt.secret.js';

export class AchievementsCoreAdapter implements StFirebaseAppAdapter {
  constructor(coreOptions: AchievementsCoreOptions) {
    const { controllers, providers } = achievementsCoreModule(coreOptions);
    this.options = {
      handlerOptions: {
        preserveExternalChanges: true,
        region: 'southamerica-east1',
      },
      extraGlobalExceptions: [
        MISSING_AUTHORIZATION_HEADER,
        UNAUTHORIZED,
        USER_NOT_CREATED,
        USER_IS_NOT_THE_SAME_AS_AUTHORIZED,
        INVALID_REDIS_CREDENTIALS,
        MISSING_API_KEY,
      ],
      swaggerDocumentBuilder: (document) => {
        if (!coreOptions.authentication) {
          return document;
        }
        const authentication =
          typeof coreOptions.authentication === 'boolean'
            ? 'JWT'
            : coreOptions.authentication;
        document.security ??= [];
        document.components ??= {};
        document.components.securitySchemes ??= {};
        switch (authentication) {
          case 'JWT': {
            document.security.push({
              bearer: [],
            });

            document.components.securitySchemes.bearer = {
              scheme: 'bearer',
              bearerFormat: 'JWT',
              type: 'http',
            };
            break;
          }
          case 'ApiKey': {
            document.components.securitySchemes.api_key = {
              name: 'x-api-key',
              type: 'apiKey',
              in: 'header',
            };
            document.security.push({
              api_key: [],
            });
            break;
          }
        }

        return document;
      },
      secrets: [
        DATABASE_CONNECTION_STRING,
        REDIS_CREDENTIALS,
        GLOBAL_SALT_SECRET,
      ],
      controllers,
      providers: [...providers, ...provideRedis(), ...provideDrizzle()],
      cors: {
        origin: '*',
      },
    };
  }

  private readonly logger = Logger.create(this);

  readonly options: StFirebaseAppOptions;

  private setAuthContext(value: unknown): void {
    let auth: AuthContext;
    if (typeof value === 'string') {
      const [, json] = safe(() => JSON.parse(value));
      auth = AuthContext.parse(json);
    } else {
      auth = AuthContext.parse(value);
    }
    getStateMetadata().set(AuthorizationContextSymbol, auth);
  }

  callableMiddleware(
    request: CallableRequest<unknown>,
  ): CallableRequest<unknown> {
    const result = CallableData.safeParse(request.data);
    if (!result.success) {
      this.logger.warn(
        'Could not parse callable data, auth context will not be set',
      );
      return request;
    }
    this.setAuthContext(result.data.attributes[AuthContextAttributeKey]);
    return request;
  }

  eventarcMiddleware(event: CloudEvent<unknown>): CloudEvent<unknown> {
    const result = EventarcData.safeParse(event.data);
    if (!result.success) {
      this.logger.warn(
        'Could not parse eventarc data, auth context will not be set',
      );
      return event;
    }
    this.setAuthContext(result.data.attributes[AuthContextAttributeKey]);
    return event;
  }

  pubSubMiddleware(
    event: CloudEvent<MessagePublishedData<unknown>>,
  ): CloudEvent<MessagePublishedData<unknown>> {
    this.setAuthContext(event.data.message.attributes[AuthContextAttributeKey]);
    return event;
  }
}
