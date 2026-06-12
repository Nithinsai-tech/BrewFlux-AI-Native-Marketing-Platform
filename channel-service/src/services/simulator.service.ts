import axios from 'axios';
import { SendMessageRequest, EventStatus, CommunicationEvent } from '../types';
import { storeService } from './store.service';
import { logger } from '../utils/logger';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Retrieve float configuration environment variables with fallback
const getEnvFloat = (key: string, defaultValue: number): number => {
  const val = process.env[key];
  return val !== undefined ? parseFloat(val) : defaultValue;
};

export class SimulatorService {
  public static async startSimulation(req: SendMessageRequest): Promise<void> {
    const { campaignId, customerId, channel, message } = req;
    
    // Resolve callback URL from env configurations
    const callbackUrl = process.env.CRM_CALLBACK_URL || 
                        (process.env.CRM_BACKEND_URL 
                          ? `${process.env.CRM_BACKEND_URL}/api/receipt` 
                          : 'http://localhost:5000/api/receipt');

    logger.info(`[Simulator] Initiating cascade for Customer: ${customerId} | Channel: ${channel} | Callback: ${callbackUrl}`);

    const triggerEvent = async (status: EventStatus) => {
      const event: CommunicationEvent = {
        eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        campaignId,
        customerId,
        channel,
        message,
        status,
        timestamp: new Date().toISOString()
      };

      // Store in memory
      storeService.addEvent(event);

      // Async post callback
      await this.sendCallbackWithRetry(callbackUrl, {
        campaignId,
        customerId,
        status,
        timestamp: event.timestamp
      });
    };

    // Run cascade asynchronously via setImmediate
    setImmediate(async () => {
      try {
        const deliveryRate = getEnvFloat('DELIVERY_RATE', 0.9);
        const openRate = getEnvFloat('OPEN_RATE', 0.6);
        const clickRate = getEnvFloat('CLICK_RATE', 0.4);
        const convertRate = getEnvFloat('CONVERT_RATE', 0.2);
        const readRate = 0.7; // 70% chance for WhatsApp/RCS read receipts

        // 1. Queued - Triggered immediately (100 - 500ms)
        await sleep(randomRange(100, 500));
        await triggerEvent('queued');

        // 2. Sent status (1000 - 3000ms)
        await sleep(randomRange(1000, 3000));
        await triggerEvent('sent');

        // 3. Delivered or Failed status (3000 - 8000ms)
        await sleep(randomRange(3000, 8000));
        const isDelivered = Math.random() < deliveryRate;
        if (!isDelivered) {
          await triggerEvent('failed');
          return; // Terminate simulation cascade
        }

        await triggerEvent('delivered');

        let canProceedToOpened = false;

        // 4. Read (WhatsApp / RCS only) - 70% chance, 5-15 seconds after delivered
        if (channel === 'whatsapp' || channel === 'rcs') {
          await sleep(randomRange(5000, 15000));
          const isRead = Math.random() < readRate;
          if (isRead) {
            await triggerEvent('read');
            
            // Opened status (10000 - 30000ms after read)
            await sleep(randomRange(10000, 30000));
            canProceedToOpened = Math.random() < openRate;
          }
        } else {
          // SMS / Email (no read status): Opened status (10000 - 30000ms after delivered)
          await sleep(randomRange(10000, 30000));
          canProceedToOpened = Math.random() < openRate;
        }

        if (!canProceedToOpened) return;

        await triggerEvent('opened');

        // 5. Clicked status (15000 - 45000ms after opened)
        await sleep(randomRange(15000, 45000));
        const isClicked = Math.random() < clickRate;
        if (!isClicked) return;

        await triggerEvent('clicked');

        // 6. Converted status (30000 - 120000ms after clicked)
        await sleep(randomRange(30000, 120000));
        const isConverted = Math.random() < convertRate;
        if (!isConverted) return;

        await triggerEvent('converted');

      } catch (err: any) {
        logger.error(`[Simulator Error] Campaign: ${campaignId} | Customer: ${customerId} | Err: ${err.message}`);
      }
    });
  }

  private static async sendCallbackWithRetry(url: string, payload: any): Promise<void> {
    const maxRetries = 3;
    const backoffs = [2000, 4000, 8000];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[Simulator Webhook] Attempt ${attempt} -> Posting ${payload.status} for customer ${payload.customerId} to ${url}`);
        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        logger.info(`[Simulator Webhook] [Success] Status "${payload.status}" delivered. Code: ${response.status}`);
        return; // Success, exit retry loop
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const errorMessage = error.response ? `HTTP ${error.response.status}` : error.message;

        logger.error(`[Simulator Webhook] [Error] Attempt ${attempt} failed for status "${payload.status}": ${errorMessage}`);

        if (isLastAttempt) {
          logger.error(`[Simulator Webhook] [Failed] Max retries reached for status "${payload.status}". Callback abandoned.`);
          return;
        }

        const backoffDelay = backoffs[attempt];
        logger.info(`[Simulator Webhook] [Retry] Retrying status "${payload.status}" in ${backoffDelay}ms...`);
        await sleep(backoffDelay);
      }
    }
  }
}
