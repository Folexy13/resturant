import { Router } from 'express';
import restaurantRoutes from './restaurant.routes';
import tableRoutes from './table.routes';
import reservationRoutes from './reservation.routes';
import waitlistRoutes from './waitlist.routes';
import authRoutes from './auth.routes';
import recurringRoutes from './recurring.routes';
import { apiLimiter } from '../middleware/rateLimiter';
import { timezoneService } from '../services/TimezoneService';

const router = Router();

// Apply rate limiting to all API routes
router.use(apiLimiter);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Reservation API is running',
    timestamp: new Date().toISOString(),
  });
});

// Timezone endpoints
router.get('/timezones', (_req, res) => {
  res.json({
    success: true,
    data: timezoneService.getCommonTimezones(),
  });
});

router.get('/timezones/all', (_req, res) => {
  res.json({
    success: true,
    data: timezoneService.getAllTimezones(),
  });
});

router.get('/timezones/validate/:timezone', (req, res) => {
  const { timezone } = req.params;
  const isValid = timezoneService.isValidTimezone(decodeURIComponent(timezone));
  res.json({
    success: true,
    data: { timezone: decodeURIComponent(timezone), isValid },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/', tableRoutes);
router.use('/', reservationRoutes);
router.use('/', waitlistRoutes);
router.use('/recurring-reservations', recurringRoutes);

export default router;