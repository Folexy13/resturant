import { Router } from 'express';
import { RecurringReservationController } from '../controllers/RecurringReservationController';
import { authenticate, optionalAuth, requireStaff, requireAdmin } from '../middleware/auth';
import { reservationLimiter } from '../middleware/rateLimiter';

const router = Router();
const recurringController = new RecurringReservationController();

// Create recurring reservation (authenticated users or guests)
router.post('/', optionalAuth, reservationLimiter, recurringController.create);

// Get user's recurring reservations
router.get('/my', authenticate, recurringController.findByUser);

// Get recurring reservation by ID
router.get('/:id', optionalAuth, recurringController.findById);

// Get upcoming occurrences
router.get('/:id/occurrences', optionalAuth, recurringController.getUpcomingOccurrences);

// Update recurring reservation
router.put('/:id', optionalAuth, recurringController.update);

// Pause recurring reservation
router.post('/:id/pause', optionalAuth, recurringController.pause);

// Resume recurring reservation
router.post('/:id/resume', optionalAuth, recurringController.resume);

// Cancel recurring reservation
router.post('/:id/cancel', optionalAuth, recurringController.cancel);

// Restaurant-specific routes (staff only)
router.get('/restaurant/:restaurantId', authenticate, requireStaff, recurringController.findByRestaurant);

// Process scheduled occurrences (admin only - typically called by cron job)
router.post('/process-scheduled', authenticate, requireAdmin, recurringController.processScheduled);

export default router;