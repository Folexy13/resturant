import { Router } from 'express';
import { WaitlistController } from '../controllers/WaitlistController';

const router = Router();
const controller = new WaitlistController();

/**
 * @swagger
 * /waitlist:
 *   post:
 *     summary: Add to waitlist
 *     description: Add a customer to the waitlist when no tables are available
 *     tags: [Waitlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWaitlistRequest'
 *     responses:
 *       201:
 *         description: Added to waitlist successfully
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
 *                   allOf:
 *                     - $ref: '#/components/schemas/Waitlist'
 *                     - type: object
 *                       properties:
 *                         position:
 *                           type: integer
 *                           description: Position in the waitlist
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/waitlist', controller.create);

/**
 * @swagger
 * /waitlist/{id}:
 *   get:
 *     summary: Get waitlist entry by ID
 *     tags: [Waitlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waitlist entry details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Waitlist'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/waitlist/:id', controller.findById);

/**
 * @swagger
 * /waitlist/{id}:
 *   put:
 *     summary: Update waitlist entry
 *     tags: [Waitlist]
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
 *               preferredStartTime:
 *                 type: string
 *               preferredEndTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Waitlist entry updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/waitlist/:id', controller.update);

/**
 * @swagger
 * /waitlist/{id}/cancel:
 *   post:
 *     summary: Cancel waitlist entry
 *     tags: [Waitlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waitlist entry cancelled
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/waitlist/:id/cancel', controller.cancel);

/**
 * @swagger
 * /waitlist/{id}/position:
 *   get:
 *     summary: Get waitlist position
 *     description: Returns current position and estimated wait time
 *     tags: [Waitlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waitlist position
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
 *                     position:
 *                       type: integer
 *                       example: 3
 *                     estimatedWaitMinutes:
 *                       type: integer
 *                       example: 90
 *                     message:
 *                       type: string
 *                       example: "You are #3 on the waitlist"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/waitlist/:id/position', controller.getPosition);

/**
 * @swagger
 * /waitlist/{id}/notify:
 *   post:
 *     summary: Notify customer of availability
 *     description: Send notification when a table becomes available
 *     tags: [Waitlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer notified successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/waitlist/:id/notify', controller.notifyAvailability);

/**
 * @swagger
 * /waitlist/{id}/expire:
 *   post:
 *     summary: Mark waitlist entry as expired
 *     description: Mark entry as expired if customer doesn't respond
 *     tags: [Waitlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waitlist entry marked as expired
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/waitlist/:id/expire', controller.markAsExpired);

/**
 * @swagger
 * /restaurants/{restaurantId}/waitlist:
 *   get:
 *     summary: Get waitlist for a restaurant
 *     tags: [Waitlist]
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
 *         description: Filter by date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, notified, converted, expired, cancelled]
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
 *         description: Waitlist entries
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
 *                     $ref: '#/components/schemas/Waitlist'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/restaurants/:restaurantId/waitlist', controller.findByRestaurant);

export default router;