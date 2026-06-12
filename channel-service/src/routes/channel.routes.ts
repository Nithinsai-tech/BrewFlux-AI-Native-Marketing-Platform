import { Router } from 'express';
import { ChannelController } from '../controllers/channel.controller';

const router = Router();

// Health check
router.get('/health', ChannelController.healthCheck);

// Send message simulation
router.post('/send', ChannelController.send);

// Backwards compatibility endpoint
router.post('/simulate', ChannelController.simulate);

// Debugging and event audits
router.get('/events', ChannelController.getEvents);
router.delete('/events', ChannelController.clearEvents);

export default router;
