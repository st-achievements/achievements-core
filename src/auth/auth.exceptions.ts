import { HttpStatus } from '@nestjs/common';
import { exception } from '@st-api/core';

// This is a copy from iam_authorizer function exceptions
// Just for documentation

export const UNAUTHORIZED = exception({
  status: HttpStatus.UNAUTHORIZED,
  errorCode: 'IAM-AUTH-0001',
  error: 'Unauthorized',
});

export const USER_NOT_CREATED = exception({
  status: HttpStatus.FORBIDDEN,
  errorCode: 'IAM-AUTH-0002',
  error:
    'User is still being created and can not be used yet. Try again later.',
  message:
    'User is still being created and can not be used yet. Try again later.',
});
