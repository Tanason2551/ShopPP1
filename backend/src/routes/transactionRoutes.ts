import { Router } from 'express';
import { createTransaction, getTransactions, getDailySummary, cancelTransaction, getDeepSummary, getSalesReportByProduct } from '../controllers/transactionController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, createTransaction);
router.get('/', authMiddleware, getTransactions);
router.delete('/:id', authMiddleware, cancelTransaction);
router.get('/summary/daily', authMiddleware, getDailySummary);
router.get('/summary/deep', authMiddleware, getDeepSummary);
router.get('/reports/sales-by-product', authMiddleware, getSalesReportByProduct);

export default router;
