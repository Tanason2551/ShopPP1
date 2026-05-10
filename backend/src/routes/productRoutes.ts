import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  getAllCategories,
} from '../controllers/productController';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

// All authenticated users can view products
router.get('/', authMiddleware, getAllProducts);
router.get('/categories', authMiddleware, getAllCategories);
router.get('/:id', authMiddleware, getProductById);
router.get('/barcode/:barcode', authMiddleware, getProductByBarcode);

// Only admins can modify products
router.post('/', authMiddleware, adminOnly, createProduct);
router.put('/:id', authMiddleware, adminOnly, updateProduct);
router.delete('/:id', authMiddleware, adminOnly, deleteProduct);

export default router;
