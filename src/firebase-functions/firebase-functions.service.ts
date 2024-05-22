import { Injectable } from '@nestjs/common';
import {
  CallableResult,
  FirebaseFunctions,
  FirebaseFunctionsCallOptions,
} from '@st-api/firebase';
import { z, ZodSchema } from 'zod';

import { getAuthContext } from '../auth/get-auth-context.js';
import { AuthContextAttributeKey } from '../constants.js';

@Injectable()
export class FirebaseFunctionsService {
  constructor(private readonly firebaseFunctions: FirebaseFunctions) {}

  async call<Schema extends ZodSchema>(
    options: FirebaseFunctionsCallOptions<Schema>,
  ): Promise<CallableResult<z.infer<Schema>>> {
    options.attributes ??= {};
    options.attributes[AuthContextAttributeKey] =
      JSON.stringify(getAuthContext());
    return this.firebaseFunctions.call(options);
  }
}
