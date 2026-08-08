import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addStockMovement
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only ADMIN and WAREHOUSE can access product routes
router.use(authenticate);
router.use(authorize(['ADMIN', 'WAREHOUSE']));

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Custom endpoint for recording manual stock adjustments
router.post('/:id/movement', addStockMovement);

export default router;
