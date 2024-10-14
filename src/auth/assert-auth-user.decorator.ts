import { COULD_NOT_FIND_USER_IN_THE_REQUEST } from '../exceptions.js';

import { AuthenticationService } from './authentication.service.js';
import { Injectable } from '@stlmpp/di';
import { CanActivate, HandlerContext, UseGuards } from '@st-api/core';

export interface AuthUserOptions {
  from?: 'headers' | 'params' | 'query';
  key?: string;
}

const OPTIONS_DEFAULT = {
  from: 'params',
  key: 'userId',
} satisfies AuthUserOptions;

export function AssertAuthUser(
  authUserOptions?: AuthUserOptions,
): ClassDecorator {
  const options: Required<AuthUserOptions> = {
    ...OPTIONS_DEFAULT,
    ...authUserOptions,
  };
  @Injectable()
  class AssertAuthUserGuard implements CanActivate {
    constructor(
      private readonly authenticationService: AuthenticationService,
    ) {}

    handle(context: HandlerContext): boolean {
      const userIdFromRequest = context[options.from][options.key];
      if (userIdFromRequest === undefined || userIdFromRequest === null) {
        throw COULD_NOT_FIND_USER_IN_THE_REQUEST(
          `Could not find ${options.key} in the request ${options.from}`,
        );
      }
      const userId = Number(userIdFromRequest);
      this.authenticationService.assertAuthenticatedUser(userId);
      return true;
    }
  }
  return (target) => {
    UseGuards(AssertAuthUserGuard)(target);
  };
}
