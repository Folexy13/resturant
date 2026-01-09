import { Router } from 'express';
import { RestaurantController } from '../controllers/RestaurantController';

const router = Router();
const controller = new RestaurantController();

// Restaurant CRUD
router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Restaurant status management
router.patch('/:id/deactivate', controller.deactivate);
router.patch('/:id/activate', controller.activate);

// Operating hours
router.get('/:id/hours', controller.getOperatingHours);

export default router;