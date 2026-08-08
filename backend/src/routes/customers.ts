import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only ADMIN and SALES can access customer routes
router.use(authenticate);
router.use(authorize(['ADMIN', 'SALES']));

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
