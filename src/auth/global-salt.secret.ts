import { defineSecret } from 'firebase-functions/params';

export const GLOBAL_SALT_SECRET: ReturnType<typeof defineSecret> =
  defineSecret('GLOBAL_SALT');
