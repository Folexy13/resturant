import { Router } from 'express';
import { TableController } from '../controllers/TableController';

const router = Router();
const controller = new TableController();

// Table CRUD (nested under restaurants)
router.post('/restaurants/:restaurantId/tables', controller.create);
router.get('/restaurants/:restaurantId/tables', controller.findAllByRestaurant);

// Table by ID operations
router.get('/tables/:id', controller.findById);
router.put('/tables/:id', controller.update);
router.delete('/tables/:id', controller.delete);

// Table status management
router.patch('/tables/:id/deactivate', controller.deactivate);
router.patch('/tables/:id/activate', controller.activate);

// Table optimization
router.get('/restaurants/:restaurantId/tables/optimal', controller.findOptimalTable);
router.get('/restaurants/:restaurantId/tables/suggest', controller.suggestTables);

export default router;