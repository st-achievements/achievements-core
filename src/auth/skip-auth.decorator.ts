import { Reflector } from '@nestjs/core';

export const SkipAuth = Reflector.createDecorator<never, boolean | undefined>({
  transform: () => true,
  key: '__ACHIEVEMENTS_CORE_SKIP_AUTH__',
});
