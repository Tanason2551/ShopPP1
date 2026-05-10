"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionController_1 = require("../controllers/transactionController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authMiddleware, transactionController_1.createTransaction);
router.get('/', authMiddleware_1.authMiddleware, transactionController_1.getTransactions);
router.delete('/:id', authMiddleware_1.authMiddleware, transactionController_1.cancelTransaction);
router.get('/summary/daily', authMiddleware_1.authMiddleware, transactionController_1.getDailySummary);
router.get('/summary/deep', authMiddleware_1.authMiddleware, transactionController_1.getDeepSummary);
router.get('/reports/sales-by-product', authMiddleware_1.authMiddleware, transactionController_1.getSalesReportByProduct);
exports.default = router;
//# sourceMappingURL=transactionRoutes.js.map