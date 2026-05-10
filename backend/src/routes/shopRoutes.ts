import { Router } from 'express';
import * as shopController from '../controllers/shopController';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', shopController.getShopConfig);
router.put('/', authMiddleware, adminOnly, shopController.updateShopConfig);

export default router;
