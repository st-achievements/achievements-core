import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getStateMetadata } from '@st-api/core';
import { isEmulator } from '@st-api/firebase';
import { type Request } from 'express';

import { MISSING_AUTHORIZATION_HEADER } from '../exceptions.js';

import { AuthenticationService } from './authentication.service.js';
import { SkipAuth } from './skip-auth.decorator.js';

export const AuthorizationContextSymbol = Symbol('AuthorizationContext');

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride(SkipAuth, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isEmulator() || skip === true) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw MISSING_AUTHORIZATION_HEADER();
    }
    const token = authorization.trim().replace('Bearer ', '');
    const response = await this.authenticationService.authenticate(token);
    getStateMetadata().set(AuthorizationContextSymbol, response);
    return true;
  }
}
