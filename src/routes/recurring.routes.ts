import { Router } from 'express';
import { RecurringReservationController } from '../controllers/RecurringReservationController';
import { authenticate, optionalAuth, requireStaff, requireAdmin } from '../middleware/auth';
import { reservationLimiter } from '../middleware/rateLimiter';

const router = Router();
const recurringController = new RecurringReservationController();

/**
 * @swagger
 * /recurring-reservations:
 *   post:
 *     summary: Create a recurring reservation
 *     description: Create a recurring reservation pattern (daily, weekly, bi-weekly, or monthly)
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecurringReservationRequest'
 *     responses:
 *       201:
 *         description: Recurring reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/RecurringReservation'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/', optionalAuth, reservationLimiter, recurringController.create);

/**
 * @swagger
 * /recurring-reservations/my:
 *   get:
 *     summary: Get current user's recurring reservations
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, cancelled, completed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of recurring reservations
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
 *                     $ref: '#/components/schemas/RecurringReservation'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my', authenticate, recurringController.findByUser);

/**
 * @swagger
 * /recurring-reservations/{id}:
 *   get:
 *     summary: Get recurring reservation by ID
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recurring reservation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RecurringReservation'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', optionalAuth, recurringController.findById);

/**
 * @swagger
 * /recurring-reservations/{id}/occurrences:
 *   get:
 *     summary: Get upcoming occurrences
 *     description: Get the next scheduled occurrences for a recurring reservation
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of occurrences to return
 *     responses:
 *       200:
 *         description: List of upcoming occurrences
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
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       status:
 *                         type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/occurrences', optionalAuth, recurringController.getUpcomingOccurrences);

/**
 * @swagger
 * /recurring-reservations/{id}:
 *   put:
 *     summary: Update recurring reservation
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partySize:
 *                 type: integer
 *               startTime:
 *                 type: string
 *               durationMinutes:
 *                 type: integer
 *               endDate:
 *                 type: string
 *                 format: date
 *               specialRequests:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recurring reservation updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', optionalAuth, recurringController.update);

/**
 * @swagger
 * /recurring-reservations/{id}/pause:
 *   post:
 *     summary: Pause recurring reservation
 *     description: Temporarily pause a recurring reservation
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recurring reservation paused
 *       400:
 *         description: Reservation is not active
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/pause', optionalAuth, recurringController.pause);

/**
 * @swagger
 * /recurring-reservations/{id}/resume:
 *   post:
 *     summary: Resume recurring reservation
 *     description: Resume a paused recurring reservation
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recurring reservation resumed
 *       400:
 *         description: Reservation is not paused
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/resume', optionalAuth, recurringController.resume);

/**
 * @swagger
 * /recurring-reservations/{id}/cancel:
 *   post:
 *     summary: Cancel recurring reservation
 *     description: Cancel a recurring reservation and optionally all future occurrences
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelFutureReservations:
 *                 type: boolean
 *                 default: true
 *                 description: Also cancel all future individual reservations
 *     responses:
 *       200:
 *         description: Recurring reservation cancelled
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/cancel', optionalAuth, recurringController.cancel);

/**
 * @swagger
 * /recurring-reservations/restaurant/{restaurantId}:
 *   get:
 *     summary: Get recurring reservations for a restaurant (Staff only)
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, cancelled, completed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of recurring reservations
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/restaurant/:restaurantId', authenticate, requireStaff, recurringController.findByRestaurant);

/**
 * @swagger
 * /recurring-reservations/process-scheduled:
 *   post:
 *     summary: Process scheduled occurrences (Admin only)
 *     description: Create individual reservations for upcoming occurrences. Typically called by a cron job.
 *     tags: [Recurring Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysAhead:
 *                 type: integer
 *                 default: 7
 *                 description: How many days ahead to create reservations
 *     responses:
 *       200:
 *         description: Scheduled occurrences processed
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
 *                     processed:
 *                       type: integer
 *                     created:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/process-scheduled', authenticate, requireAdmin, recurringController.processScheduled);

export default router;