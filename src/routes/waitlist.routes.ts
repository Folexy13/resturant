import { Router } from 'express';
import { WaitlistController } from '../controllers/WaitlistController';

const router = Router();
const controller = new WaitlistController();

// Waitlist CRUD
router.post('/waitlist', controller.create);
router.get('/waitlist/:id', controller.findById);
router.put('/waitlist/:id', controller.update);
router.post('/waitlist/:id/cancel', controller.cancel);

// Waitlist position
router.get('/waitlist/:id/position', controller.getPosition);

// Waitlist notifications
router.post('/waitlist/:id/notify', controller.notifyAvailability);
router.post('/waitlist/:id/expire', controller.markAsExpired);

// Restaurant waitlist
router.get('/restaurants/:restaurantId/waitlist', controller.findByRestaurant);

export default router;