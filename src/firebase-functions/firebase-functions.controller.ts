import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZBody, zDto, ZParams } from '@st-api/core';
import { Logger } from '@st-api/firebase';
import { z } from 'zod';

import { FirebaseFunctionsService } from './firebase-functions.service.js';

class CallableParamDto extends zDto(
  z.object({
    callableName: z.string().trim().min(1).openapi({
      example: 'usr_creation',
      description: 'Name of the callable',
    }),
  }),
) {}

class CallableBody extends zDto(
  z.any().openapi({
    example: {
      id: 1,
    },
  }),
) {}

@ApiTags('Emulator')
@Controller('callable')
export class FirebaseFunctionsController {
  constructor(
    private readonly firebaseFunctionsService: FirebaseFunctionsService,
  ) {}

  private readonly logger = Logger.create(this);

  @Post(':callableName')
  async callable(
    @ZParams() { callableName }: CallableParamDto,
    @ZBody() body: CallableBody,
  ): Promise<unknown> {
    this.logger.info(`Calling ${callableName} with body`, {
      body,
    });
    const [error, response] = await this.firebaseFunctionsService.call({
      body,
      name: callableName,
      schema: z.any(),
    });
    if (error) {
      throw error;
    }
    return response;
  }
}
