import { Router } from 'express';
import { TableController } from '../controllers/TableController';

const router = Router();
const controller = new TableController();

/**
 * @swagger
 * /restaurants/{restaurantId}/tables:
 *   post:
 *     summary: Add a table to a restaurant
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTableRequest'
 *     responses:
 *       201:
 *         description: Table created successfully
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
 *                   $ref: '#/components/schemas/Table'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/restaurants/:restaurantId/tables', controller.create);

/**
 * @swagger
 * /restaurants/{restaurantId}/tables:
 *   get:
 *     summary: Get all tables for a restaurant
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of tables
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
 *                     $ref: '#/components/schemas/Table'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/restaurants/:restaurantId/tables', controller.findAllByRestaurant);

/**
 * @swagger
 * /tables/{id}:
 *   get:
 *     summary: Get table by ID
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Table details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Table'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/tables/:id', controller.findById);

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Update table
 *     tags: [Tables]
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
 *               tableNumber:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               minCapacity:
 *                 type: integer
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/tables/:id', controller.update);

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Delete table
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/tables/:id', controller.delete);

/**
 * @swagger
 * /tables/{id}/deactivate:
 *   patch:
 *     summary: Deactivate table
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Table deactivated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/tables/:id/deactivate', controller.deactivate);

/**
 * @swagger
 * /tables/{id}/activate:
 *   patch:
 *     summary: Activate table
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Table activated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/tables/:id/activate', controller.activate);

/**
 * @swagger
 * /restaurants/{restaurantId}/tables/optimal:
 *   get:
 *     summary: Find optimal table for party size
 *     description: Returns the best-fit table (smallest capacity that fits the party)
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: partySize
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *     responses:
 *       200:
 *         description: Optimal table found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Table'
 *       404:
 *         description: No suitable table found
 */
router.get('/restaurants/:restaurantId/tables/optimal', controller.findOptimalTable);

/**
 * @swagger
 * /restaurants/{restaurantId}/tables/suggest:
 *   get:
 *     summary: Get table suggestions for party size
 *     description: Returns multiple table options sorted by fit score
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: partySize
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Table suggestions
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Table'
 *                       - type: object
 *                         properties:
 *                           fitScore:
 *                             type: integer
 *                             description: Lower is better (0 = perfect fit)
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/restaurants/:restaurantId/tables/suggest', controller.suggestTables);

export default router;