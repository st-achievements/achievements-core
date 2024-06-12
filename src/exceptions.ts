import { HttpStatus } from '@nestjs/common';
import { exception } from '@st-api/core';

export const INVALID_REDIS_CREDENTIALS = exception({
  errorCode: 'ACH-CORE-0001',
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Invalid Redis Credentials',
});

export const MISSING_AUTHORIZATION_HEADER = exception({
  errorCode: 'ACH-CORE-0002',
  status: HttpStatus.UNAUTHORIZED,
  error: 'Header "Authorization" is missing',
  message: 'Header "Authorization" is missing',
});

export const UNAUTHORIZED = exception({
  status: HttpStatus.UNAUTHORIZED,
  errorCode: 'ACH-CORE-0003',
  error: 'Unauthorized',
});

export const USER_NOT_CREATED = exception({
  status: HttpStatus.FORBIDDEN,
  errorCode: 'ACH-CORE-0004',
  error:
    'User is still being created and can not be used yet. Try again later.',
  message:
    'User is still being created and can not be used yet. Try again later.',
});

export const USER_IS_NOT_THE_SAME_AS_AUTHORIZED = exception({
  status: HttpStatus.FORBIDDEN,
  errorCode: 'ACH-CORE-0005',
  error: 'User is not authorized to access this resource',
});

export const COULD_NOT_FIND_USER_IN_THE_REQUEST = exception({
  status: HttpStatus.BAD_REQUEST,
  errorCode: 'ACH-CORE-0006',
  message: 'Could not find the userId in the request',
});
