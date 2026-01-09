import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';

const router = Router();
const controller = new ReservationController();

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationRequest'
 *     responses:
 *       201:
 *         description: Reservation created successfully
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
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               capacityExceeded:
 *                 summary: Party size exceeds table capacity
 *                 value:
 *                   success: false
 *                   message: "Table cannot accommodate party of 6 (capacity: 4)"
 *               outsideHours:
 *                 summary: Outside operating hours
 *                 value:
 *                   success: false
 *                   message: "Reservation time is outside restaurant operating hours"
 *               doubleBooking:
 *                 summary: Table already booked
 *                 value:
 *                   success: false
 *                   message: "Table is not available for the requested time slot"
 */
router.post('/reservations', controller.create);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/reservations/:id', controller.findById);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Update reservation
 *     tags: [Reservations]
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
 *                 minimum: 1
 *                 maximum: 20
 *               startTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               durationMinutes:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 240
 *               specialRequests:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation updated successfully
 *       400:
 *         description: Cannot modify reservation (already seated/completed/cancelled)
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/reservations/:id', controller.update);

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   post:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
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
 *               cancellationReason:
 *                 type: string
 *                 example: "Change of plans"
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
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
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Cannot cancel reservation (already seated/completed)
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/reservations/:id/cancel', controller.cancel);

/**
 * @swagger
 * /reservations/{id}/confirm:
 *   post:
 *     summary: Confirm a pending reservation
 *     tags: [Reservations]
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
 *               sendConfirmation:
 *                 type: boolean
 *                 default: true
 *                 description: Send confirmation notification to customer
 *     responses:
 *       200:
 *         description: Reservation confirmed successfully
 *       400:
 *         description: Reservation is not in pending status
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/reservations/:id/confirm', controller.confirm);

/**
 * @swagger
 * /reservations/{id}/seat:
 *   post:
 *     summary: Mark reservation as seated
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation marked as seated
 *       400:
 *         description: Reservation is not in confirmed status
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/reservations/:id/seat', controller.markAsSeated);

/**
 * @swagger
 * /reservations/{id}/complete:
 *   post:
 *     summary: Mark reservation as completed
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation marked as completed
 *       400:
 *         description: Reservation is not in seated status
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/reservations/:id/complete', controller.markAsCompleted);

/**
 * @swagger
 * /reservations/{id}/no-show:
 *   post:
 *     summary: Mark reservation as no-show
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation marked as no-show
 *       400:
 *         description: Reservation is not in confirmed status
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/reservations/:id/no-show', controller.markAsNoShow);

/**
 * @swagger
 * /restaurants/{restaurantId}/reservations:
 *   get:
 *     summary: Get reservations for a restaurant
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, seated, completed, cancelled, no_show]
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
 *         description: List of reservations
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
 *                     $ref: '#/components/schemas/Reservation'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/restaurants/:restaurantId/reservations', controller.findByRestaurant);

/**
 * @swagger
 * /restaurants/{restaurantId}/availability:
 *   get:
 *     summary: Get available time slots for a restaurant
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *       - in: query
 *         name: partySize
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *       - in: query
 *         name: durationMinutes
 *         schema:
 *           type: integer
 *           default: 90
 *           minimum: 30
 *           maximum: 240
 *     responses:
 *       200:
 *         description: Available time slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailabilityResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/restaurants/:restaurantId/availability', controller.getAvailability);

/**
 * @swagger
 * /restaurants/{restaurantId}/check-availability:
 *   get:
 *     summary: Check if a specific time slot is available
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startTime
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         example: "19:00"
 *       - in: query
 *         name: partySize
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *       - in: query
 *         name: durationMinutes
 *         schema:
 *           type: integer
 *           default: 90
 *     responses:
 *       200:
 *         description: Availability check result
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
 *                     available:
 *                       type: boolean
 *                     availableTables:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Table'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/restaurants/:restaurantId/check-availability', controller.checkTableAvailability);

export default router;