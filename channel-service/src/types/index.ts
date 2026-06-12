export type ChannelType = 'whatsapp' | 'sms' | 'email' | 'rcs';

export type EventStatus = 
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'opened'
  | 'clicked'
  | 'converted'
  | 'failed';

export interface SendMessageRequest {
  campaignId: string;
  customerId: string;
  channel: ChannelType;
  message: string;
}

export interface CommunicationEvent {
  eventId: string;
  campaignId: string;
  customerId: string;
  channel: ChannelType;
  message: string;
  status: EventStatus;
  timestamp: string;
}

export interface WebhookPayload {
  campaignId: string;
  customerId: string;
  status: EventStatus;
  timestamp: string;
}
