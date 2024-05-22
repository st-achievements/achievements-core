import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { getStateMetadata } from '@st-api/core';
import { FirebaseFunctions, isEmulator } from '@st-api/firebase';
import { type Request } from 'express';

import { AuthenticationIdTokenCallableName } from '../constants.js';
import { MISSING_AUTHORIZATION_HEADER } from '../exceptions.js';

import { AuthContext } from './auth.schema.js';
import { Reflector } from '@nestjs/core';
import { SkipAuth } from './skip-auth.decorator.js';

export const AuthorizationContextSymbol = Symbol('AuthorizationContext');

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly firebaseFunctions: FirebaseFunctions,
    private readonly reflector: Reflector,
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
    const [error, response] = await this.firebaseFunctions.call({
      name: AuthenticationIdTokenCallableName,
      body: {
        token,
      },
      schema: AuthContext,
    });
    if (error) {
      throw error;
    }
    getStateMetadata().set(AuthorizationContextSymbol, response);
    return true;
  }
}
