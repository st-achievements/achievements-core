import { createParamDecorator } from '@nestjs/common';

import { getAuthContext } from './get-auth-context.js';

export const GetAuthContext = createParamDecorator(() => getAuthContext());
