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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Restaurant Reservation API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Reservation API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /timezones:
 *   get:
 *     summary: Get common timezones
 *     description: Returns a list of commonly used timezones
 *     tags: [Timezones]
 *     responses:
 *       200:
 *         description: List of common timezones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Timezone'
 */
router.get('/timezones', (_req, res) => {
  res.json({
    success: true,
    data: timezoneService.getCommonTimezones(),
  });
});

/**
 * @swagger
 * /timezones/all:
 *   get:
 *     summary: Get all timezones
 *     description: Returns a complete list of all available timezones
 *     tags: [Timezones]
 *     responses:
 *       200:
 *         description: List of all timezones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/timezones/all', (_req, res) => {
  res.json({
    success: true,
    data: timezoneService.getAllTimezones(),
  });
});

/**
 * @swagger
 * /timezones/validate/{timezone}:
 *   get:
 *     summary: Validate a timezone
 *     description: Check if a timezone string is valid
 *     tags: [Timezones]
 *     parameters:
 *       - in: path
 *         name: timezone
 *         required: true
 *         schema:
 *           type: string
 *         description: Timezone to validate (URL encoded, e.g., America%2FNew_York)
 *         example: America/New_York
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     timezone:
 *                       type: string
 *                       example: "America/New_York"
 *                     isValid:
 *                       type: boolean
 *                       example: true
 */
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