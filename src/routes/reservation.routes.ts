import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';

const router = Router();
const controller = new ReservationController();

// Reservation CRUD
router.post('/reservations', controller.create);
router.get('/reservations/:id', controller.findById);
router.put('/reservations/:id', controller.update);

// Reservation status management
router.post('/reservations/:id/cancel', controller.cancel);
router.post('/reservations/:id/confirm', controller.confirm);
router.post('/reservations/:id/seat', controller.markAsSeated);
router.post('/reservations/:id/complete', controller.markAsCompleted);
router.post('/reservations/:id/no-show', controller.markAsNoShow);

// Restaurant reservations
router.get('/restaurants/:restaurantId/reservations', controller.findByRestaurant);

// Availability
router.get('/restaurants/:restaurantId/availability', controller.getAvailability);
router.get('/restaurants/:restaurantId/check-availability', controller.checkTableAvailability);

export default router;