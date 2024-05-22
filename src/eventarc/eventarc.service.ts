import { Injectable } from '@nestjs/common';
import { coerceArray } from '@st-api/core';
import { Eventarc, EventarcPublishOptions } from '@st-api/firebase';

import { getAuthContext } from '../auth/get-auth-context.js';
import { AuthContextAttributeKey } from '../constants.js';

@Injectable()
export class EventarcService {
  constructor(private readonly eventarc: Eventarc) {}

  async publish(
    optionOrOptions: EventarcPublishOptions | EventarcPublishOptions[],
  ): Promise<void> {
    const options = coerceArray(optionOrOptions);
    for (const option of options) {
      option.attributes ??= {};
      option.attributes[AuthContextAttributeKey] =
        JSON.stringify(getAuthContext());
    }
    await this.eventarc.publish(options);
  }
}
