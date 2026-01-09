import { Router } from 'express';
import { RestaurantController } from '../controllers/RestaurantController';

const router = Router();
const controller = new RestaurantController();

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRestaurantRequest'
 *     responses:
 *       201:
 *         description: Restaurant created successfully
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
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', controller.create);

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive restaurants
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
 *         description: List of restaurants
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
 *                     $ref: '#/components/schemas/Restaurant'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', controller.findAll);

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Get restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details with tables
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Restaurant'
 *                     - type: object
 *                       properties:
 *                         tables:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Table'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', controller.findById);

/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     summary: Update restaurant
 *     tags: [Restaurants]
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
 *               name:
 *                 type: string
 *               openingTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               closingTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               timezone:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     summary: Delete restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Restaurant deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', controller.delete);

/**
 * @swagger
 * /restaurants/{id}/deactivate:
 *   patch:
 *     summary: Deactivate restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Restaurant deactivated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/deactivate', controller.deactivate);

/**
 * @swagger
 * /restaurants/{id}/activate:
 *   patch:
 *     summary: Activate restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Restaurant activated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/activate', controller.activate);

/**
 * @swagger
 * /restaurants/{id}/hours:
 *   get:
 *     summary: Get restaurant operating hours
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Operating hours
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
 *                     openingTime:
 *                       type: string
 *                     closingTime:
 *                       type: string
 *                     timezone:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/hours', controller.getOperatingHours);

export default router;