import { Controller, Handler, ZBody, ZParams } from '@st-api/core';
import { Logger } from '@st-api/firebase';
import { z } from 'zod';

import { FirebaseFunctionsService } from './firebase-functions.service.js';

const CallableParamDto = z.object({
  callableName: z.string().trim().min(1).openapi({
    example: 'usr_creation',
    description: 'Name of the callable',
  }),
});

type CallableParamDto = z.output<typeof CallableParamDto>;

const CallableBody = z.any().openapi({
  example: {
    id: 1,
  },
});

type CallableBody = z.output<typeof CallableBody>;

// @ApiTags('Emulator')
@Controller({
  path: 'callable/:callableName',
  method: 'POST',
})
export class FirebaseFunctionsController implements Handler {
  constructor(
    private readonly firebaseFunctionsService: FirebaseFunctionsService,
  ) {}

  private readonly logger = Logger.create(this);

  async handle(
    @ZParams(CallableParamDto) { callableName }: CallableParamDto,
    @ZBody(CallableBody) body: CallableBody,
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
