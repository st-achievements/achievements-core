import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { COULD_NOT_FIND_USER_IN_THE_REQUEST } from '../exceptions.js';

import { AuthenticationService } from './authentication.service.js';

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
): ClassDecorator & MethodDecorator {
  const options: Required<AuthUserOptions> = {
    ...OPTIONS_DEFAULT,
    ...authUserOptions,
  };
  @Injectable()
  class AssertAuthUserGuard implements CanActivate {
    constructor(
      private readonly authenticationService: AuthenticationService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
      const userIdFromRequest = request[options.from][options.key];
      if (!userIdFromRequest || typeof userIdFromRequest !== 'string') {
        throw COULD_NOT_FIND_USER_IN_THE_REQUEST(
          `Could not find ${options.key} in the request ${options.from}`,
        );
      }
      const userId = Number(userIdFromRequest);
      this.authenticationService.assertAuthenticatedUser(userId);
      return true;
    }
  }
  return applyDecorators(UseGuards(AssertAuthUserGuard));
}
