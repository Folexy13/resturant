import { Router } from 'express';
import restaurantRoutes from './restaurant.routes';
import tableRoutes from './table.routes';
import reservationRoutes from './reservation.routes';
import waitlistRoutes from './waitlist.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Reservation API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/restaurants', restaurantRoutes);
router.use('/', tableRoutes);
router.use('/', reservationRoutes);
router.use('/', waitlistRoutes);

export default router;