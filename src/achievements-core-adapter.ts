import { DATABASE_CONNECTION_STRING } from '@st-achievements/database';
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
  MISSING_AUTHORIZATION_HEADER,
  UNAUTHORIZED,
  USER_NOT_CREATED,
} from './exceptions.js';

export class AchievementsCoreAdapter implements StFirebaseAppAdapter {
  private readonly logger = Logger.create(this);

  readonly options: StFirebaseAppOptions = {
    handlerOptions: {
      preserveExternalChanges: true,
    },
    extraGlobalExceptions: [
      MISSING_AUTHORIZATION_HEADER,
      UNAUTHORIZED,
      USER_NOT_CREATED,
    ],
    swagger: {
      documentBuilder: (document) =>
        document.addBearerAuth({
          scheme: 'bearer',
          type: 'http',
          bearerFormat: 'JWT',
        }),
      documentFactory: (document) => {
        document.security ??= [];
        document.security.push({
          bearer: [],
        });
        return document;
      },
    },
    secrets: [DATABASE_CONNECTION_STRING],
  };

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
