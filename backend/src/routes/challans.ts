import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
  updatePayment
} from '../controllers/challanController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All roles can access challan endpoints according to standard ops logic
router.use(authenticate);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', createChallan);

// State transitions
router.post('/:id/confirm', confirmChallan);
router.post('/:id/cancel', cancelChallan);

// Payment
router.put('/:id/payment', authorize(['ADMIN', 'ACCOUNTS']), updatePayment);

export default router;
