import { Router } from 'express';
import { createRestockBill, getRestockBills } from '../controllers/restockController';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, adminOnly, createRestockBill);
router.get('/', authMiddleware, adminOnly, getRestockBills);

export default router;
