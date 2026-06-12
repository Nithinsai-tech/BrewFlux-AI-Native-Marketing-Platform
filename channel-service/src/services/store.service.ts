import { CommunicationEvent } from '../types';
import { logger } from '../utils/logger';

class StoreService {
  private events: CommunicationEvent[] = [];

  public addEvent(event: CommunicationEvent): void {
    this.events.push(event);
    logger.info(`[Store] Stored event: Customer ${event.customerId} -> Status: ${event.status}`);
  }

  public getEvents(campaignId?: string): CommunicationEvent[] {
    if (campaignId) {
      return this.events.filter(e => e.campaignId === campaignId);
    }
    return this.events;
  }

  public clearEvents(): void {
    this.events = [];
    logger.info('[Store] Cleared all communication events.');
  }
}

export const storeService = new StoreService();
