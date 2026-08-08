import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan
} from '../controllers/challanController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All roles can access challan endpoints according to standard ops logic
router.use(authenticate);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', createChallan);

// State transitions
router.post('/:id/confirm', confirmChallan);
router.post('/:id/cancel', cancelChallan);

export default router;
