import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZBody, ZRes } from '@st-api/core';
import { z } from 'zod';

import { EventarcService } from './eventarc.service.js';

const BodySchema = z.object({
  events: z
    .object({
      eventType: z.string().trim().min(1).openapi({
        description: 'Event Type',
        example: 'com.st-achievements.event.usr_created.v1',
      }),
      body: z
        .record(z.any())
        .or(z.array(z.any()))
        .openapi({
          description: 'JSON that will be sent to the body of the event',
          example: {
            id: 1,
          },
        }),
    })
    .array()
    .min(1),
});
type BodyType = z.infer<typeof BodySchema>;

@ApiTags('Emulator')
@Controller('eventarc')
export class EventarcController {
  constructor(private readonly eventarcService: EventarcService) {}

  @Post()
  @ZRes(z.void())
  @ApiOperation({
    description: 'Use this API to publish events to Eventarc',
  })
  async post(@ZBody(BodySchema) body: BodyType): Promise<void> {
    await this.eventarcService.publish(
      body.events.map((event) => ({
        type: event.eventType,
        body: event.body,
      })),
    );
  }
}
