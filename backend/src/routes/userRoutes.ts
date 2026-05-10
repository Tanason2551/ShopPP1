import { Router } from 'express';
import { getAllUsers, updateUserRole, deleteUser, createUser, updateUser } from '../controllers/userController';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, adminOnly, getAllUsers);
router.post('/', authMiddleware, adminOnly, createUser);
router.put('/:id', authMiddleware, adminOnly, updateUser);
router.put('/:id/role', authMiddleware, adminOnly, updateUserRole);
router.delete('/:id', authMiddleware, adminOnly, deleteUser);

export default router;
