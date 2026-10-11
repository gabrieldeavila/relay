import type { DeliveryResult } from '../data/event-resumer.js';

export interface DeliveryReply {
  status: number;
  message: string;
}

const REPLIES: Record<DeliveryResult, DeliveryReply> = {
  resumed: { status: 200, message: 'Done. The flow is moving on.' },
  stored: {
    status: 202,
    message: 'Received. The flow will use it when it gets there.',
  },
  duplicate: { status: 200, message: 'Already received.' },
  closed: {
    status: 409,
    message: 'This step was already answered or the flow ended.',
  },
  rejected: { status: 400, message: 'This step does not accept that answer.' },
  not_found: { status: 404, message: 'This link is not valid.' },
};

export const deliveryReply = (result: DeliveryResult) => REPLIES[result];
