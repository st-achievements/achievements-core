import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZBody, ZRes } from '@st-api/core';
import { z } from 'zod';

import { PubSubService } from './pub-sub.service.js';

const BodySchema = z.object({
  messages: z
    .object({
      topic: z.string().trim().min(1).openapi({
        description: 'PubSub topic',
        example: 'com.st-achievements.queue.usr_creation.v1',
      }),
      data: z
        .record(z.any())
        .or(z.array(z.any()))
        .openapi({
          description: 'JSON that will be sent to the PubSub topic',
          example: {
            id: 1,
          },
        }),
      attributes: z
        .record(z.string())
        .default({})
        .openapi({
          description: 'Attributes that will be sent to the PubSub topic',
          example: {
            customAttribute: 'This is custom',
          },
        }),
    })
    .array()
    .min(1),
  mode: z.enum(['serial', 'concurrent']).default('serial'),
});
type BodyType = z.infer<typeof BodySchema>;

@ApiTags('Emulator')
@Controller('pub-sub')
export class PubSubController {
  constructor(private readonly pubSubService: PubSubService) {}

  @Post()
  @ZRes(z.void())
  @ApiOperation({
    description: 'Use this API to publish messages to a specific PubSub topic',
  })
  async post(@ZBody(BodySchema) body: BodyType): Promise<void> {
    switch (body.mode) {
      case 'serial': {
        for (const message of body.messages) {
          await this.pubSubService.publish(message.topic, {
            attributes: message.attributes,
            json: message.data,
          });
        }
        break;
      }
      case 'concurrent': {
        await Promise.all(
          body.messages.map((message) =>
            this.pubSubService.publish(message.topic, {
              attributes: message.attributes,
              json: message.data,
            }),
          ),
        );
        break;
      }
    }
  }
}
