import { Router } from 'express';
import {
  getPOs,
  getPOById,
  createPO,
  confirmPO,
  cancelPO
} from '../controllers/poController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'WAREHOUSE']));

router.get('/', getPOs);
router.get('/:id', getPOById);
router.post('/', createPO);
router.post('/:id/confirm', confirmPO);
router.post('/:id/cancel', cancelPO);

export default router;
