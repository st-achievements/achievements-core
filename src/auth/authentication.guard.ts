import { CanActivate, getStateMetadata, HandlerContext } from '@st-api/core';
import { isEmulator, Logger } from '@st-api/firebase';

import { MISSING_AUTHORIZATION_HEADER } from '../exceptions.js';

import { AuthenticationService } from './authentication.service.js';
import { Injectable } from '@stlmpp/di';

export const AuthorizationContextSymbol = Symbol('AuthorizationContext');

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly authenticationService: AuthenticationService) {}

  private readonly logger = Logger.create(this);

  async handle(context: HandlerContext): Promise<boolean> {
    const emulator = isEmulator();
    if (emulator) {
      if (emulator) {
        this.logger.info(
          'Skipping Authentication Guard because emulator is running',
        );
      }
      return true;
    }
    const authorization = context.headers.authorization
      ? String(context.headers.authorization)
      : undefined;
    if (!authorization) {
      throw MISSING_AUTHORIZATION_HEADER();
    }
    const token = authorization.trim().replace('Bearer ', '');
    const response = await this.authenticationService.authenticate(token);
    getStateMetadata().set(AuthorizationContextSymbol, response);
    return true;
  }
}
