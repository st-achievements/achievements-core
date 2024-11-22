import { CanActivate, getStateMetadata, HandlerContext } from '@st-api/core';
import { isEmulator, Logger } from '@st-api/firebase';
import { Injectable } from '@stlmpp/di';
import { AuthenticationStrategy } from './authentication.strategy.js';

export const AuthorizationContextSymbol = Symbol('AuthorizationContext');

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly authenticationStrategy: AuthenticationStrategy,
  ) {}

  private readonly logger = Logger.create(this);

  async handle(context: HandlerContext): Promise<boolean> {
    if (isEmulator()) {
      this.logger.info(
        'Skipping Authentication Guard because emulator is running',
      );
      return true;
    }
    const response = await this.authenticationStrategy.authenticate(context);
    getStateMetadata().set(AuthorizationContextSymbol, response);
    return true;
  }
}
