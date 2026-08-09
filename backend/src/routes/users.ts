import { Router } from 'express';
import { getUsers, createUser, updateUser } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only ADMIN can manage users
router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);

export default router;
