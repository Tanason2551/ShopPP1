import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getAllCategories);
router.post('/', authMiddleware, adminOnly, createCategory);
router.put('/:id', authMiddleware, adminOnly, updateCategory);
router.delete('/:id', authMiddleware, adminOnly, deleteCategory);

export default router;
