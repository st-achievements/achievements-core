import { Topic } from '@google-cloud/pubsub';
import { PubSub } from '@st-api/firebase';

import { getAuthContext } from '../auth/get-auth-context.js';
import { AuthContextAttributeKey } from '../constants.js';
import { Injectable } from '@stlmpp/di';

@Injectable()
export class PubSubService {
  constructor(private readonly pubSub: PubSub) {}

  async publish(
    topic: string,
    message: Parameters<Topic['publishMessage']>[0],
  ): Promise<void> {
    message.attributes ??= {};
    message.attributes[AuthContextAttributeKey] =
      JSON.stringify(getAuthContext());
    await this.pubSub.publish(topic, message);
  }
}
