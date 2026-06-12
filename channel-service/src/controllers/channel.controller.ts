import { Request, Response, NextFunction } from 'express';
import { SimulatorService } from '../services/simulator.service';
import { storeService } from '../services/store.service';
import { SendMessageRequest } from '../types';
import { logger } from '../utils/logger';

export class ChannelController {
  /**
   * Health Check and Configuration status
   */
  public static healthCheck(req: Request, res: Response): void {
    res.status(200).json({
      status: 'OK',
      service: 'XenoCRM Independent Channel Service (TypeScript)',
      port: process.env.PORT || 6000,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Receives a dispatch request and starts the simulation cascade.
   * Expects: campaignId, customerId, channel, message
   */
  public static async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId, customerId, channel, message } = req.body as SendMessageRequest;

      // Validate required inputs
      if (!campaignId || !customerId || !channel || !message) {
        res.status(400).json({
          error: 'campaignId, customerId, channel, and message are required.'
        });
        return;
      }

      logger.info(`[Controller] Message send requested for Campaign: ${campaignId} | Customer: ${customerId} | Channel: ${channel}`);

      // Initiate simulation cascade asynchronously
      await SimulatorService.startSimulation({
        campaignId,
        customerId,
        channel,
        message
      });

      // Respond immediately with queued status
      res.status(200).json({
        success: true,
        message: 'Message dispatch received and queued for simulation.',
        status: 'queued'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * For backwards compatibility with any legacy code calling POST /simulate
   */
  public static async simulate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract from old format payload: communicationId maps to campaignId/customerId context
      const { campaignId, customerId, channel, message, communicationId } = req.body;
      
      const resolvedCampaignId = campaignId || communicationId || 'legacy-campaign';
      const resolvedCustomerId = customerId || 'legacy-customer';

      await SimulatorService.startSimulation({
        campaignId: resolvedCampaignId,
        customerId: resolvedCustomerId,
        channel: channel || 'sms',
        message: message || ''
      });

      res.status(200).json({ status: 'queued' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve all stored events (optionally filtered by campaignId)
   */
  public static getEvents(req: Request, res: Response): void {
    const campaignId = req.query.campaignId as string | undefined;
    const events = storeService.getEvents(campaignId);
    res.status(200).json({
      count: events.length,
      events
    });
  }

  /**
   * Clear all stored events
   */
  public static clearEvents(req: Request, res: Response): void {
    storeService.clearEvents();
    res.status(200).json({
      success: true,
      message: 'All local events cleared.'
    });
  }
}
