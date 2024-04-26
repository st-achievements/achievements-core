import { HttpStatus } from '@nestjs/common';
import { exception } from '@st-api/core';

export const INVALID_REDIS_CREDENTIALS = exception({
  errorCode: 'ACH-CORE-0001',
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Invalid Redis Credentials',
});
