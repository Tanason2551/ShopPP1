"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailySummary = exports.getDeepSummary = exports.getSalesReportByProduct = exports.getTransactions = exports.cancelTransaction = exports.createTransaction = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { totalAmount, paymentMethod, items } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.dbId;
    if (!userId) {
        return res.status(401).json({ error: 'User not identified' });
    }
    try {
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Validate Stock for all items first
            for (const item of items) {
                const product = yield tx.product.findUnique({
                    where: { id: item.productId },
                    select: { stockQty: true, name: true }
                });
                if (!product) {
                    throw new Error(`ไม่พบสินค้า: ${item.productId}`);
                }
                if (product.stockQty < item.quantity) {
                    throw new Error(`สินค้า "${product.name}" ไม่เพียงพอ (คงเหลือ ${product.stockQty}, ต้องการ ${item.quantity})`);
                }
            }
            // 2. Create Transaction
            const transaction = yield tx.transaction.create({
                data: {
                    totalAmount,
                    paymentMethod,
                    userId,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
                include: { items: true },
            });
            // 2. Update Stock
            for (const item of items) {
                yield tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQty: {
                            decrement: item.quantity,
                        },
                    },
                });
                // 3. Create Stock Log
                yield tx.stockLog.create({
                    data: {
                        productId: item.productId,
                        changeQty: -item.quantity,
                        type: 'OUT',
                        userId: userId,
                        note: `Transaction ${transaction.id}`,
                    },
                });
            }
            return transaction;
        }));
        // Emit real-time update
        const ioInstance = req.app.get('io');
        if (ioInstance) {
            ioInstance.emit('newTransaction', result);
        }
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Transaction error:', error);
        // If it's a validation error we threw, return it clearly
        const errorMessage = error.message || 'เกิดข้อผิดพลาดในการชำระเงิน';
        res.status(400).json({ error: errorMessage });
    }
});
exports.createTransaction = createTransaction;
const firebaseVerify_1 = require("../utils/firebaseVerify");
const cancelTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { password } = req.body;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.dbId;
    console.log(`[CANCEL] Attempting to cancel transaction: ${id}`);
    console.log(`[CANCEL] Operator: ${userEmail}`);
    if (!userEmail) {
        return res.status(401).json({ error: 'User not identified' });
    }
    // 1. Verify Password with Firebase
    console.log(`[CANCEL] Verifying password with Firebase for: ${userEmail}`);
    const firebaseUser = yield (0, firebaseVerify_1.verifyFirebasePassword)(userEmail, password);
    if (!firebaseUser) {
        console.warn('[CANCEL] Firebase Password mismatch');
        return res.status(403).json({ error: 'รหัสผ่านไม่ถูกต้อง (กรุณาใช้รหัสผ่าน Firebase ของคุณ)' });
    }
    // 2. Check if user has ADMIN role in our DB
    const dbUser = yield prisma_1.default.user.findUnique({
        where: { username: userEmail }
    });
    if (!dbUser || dbUser.role !== 'ADMIN') {
        console.warn(`[CANCEL] User ${userEmail} is not an ADMIN`);
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการยกเลิกบิล (ต้องเป็นแอดมินเท่านั้น)' });
    }
    try {
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            console.log('[CANCEL] Starting transaction...');
            // 1. Get Transaction with items
            const transaction = yield tx.transaction.findUnique({
                where: { id },
                include: { items: true }
            });
            if (!transaction)
                throw new Error('ไม่พบรายการขาย');
            if (transaction.status === 'CANCELLED')
                throw new Error('รายการนี้ถูกยกเลิกไปแล้ว');
            console.log(`[CANCEL] Found transaction with ${transaction.items.length} items`);
            // 2. Restore Stock
            for (const item of transaction.items) {
                console.log(`[CANCEL] Restoring ${item.quantity} units for product ${item.productId}`);
                yield tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQty: {
                            increment: item.quantity,
                        },
                    },
                });
                // 3. Create Stock Log (IN)
                yield tx.stockLog.create({
                    data: {
                        productId: item.productId,
                        changeQty: item.quantity,
                        type: 'IN',
                        userId: userId,
                        note: `CANCELLED Transaction ${transaction.id}`,
                    },
                });
            }
            // 4. Update Transaction Status
            console.log('[CANCEL] Updating transaction status to CANCELLED');
            return yield tx.transaction.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });
        }));
        console.log('[CANCEL] Success!');
        // Emit real-time update
        const ioInstance = req.app.get('io');
        if (ioInstance) {
            ioInstance.emit('transactionCancelled', { id, result });
        }
        res.json({ message: 'ยกเลิกรายการสำเร็จ และคืนสต็อกเรียบร้อยแล้ว', result });
    }
    catch (error) {
        console.error('[CANCEL] Error during transaction:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel transaction' });
    }
});
exports.cancelTransaction = cancelTransaction;
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactions = yield prisma_1.default.transaction.findMany({
            include: {
                items: { include: { product: true } },
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit for performance
        });
        res.json(transactions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
exports.getTransactions = getTransactions;
const getSalesReportByProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = { status: { not: 'CANCELLED' } };
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate)
                whereClause.createdAt.gte = new Date(startDate);
            if (endDate)
                whereClause.createdAt.lte = new Date(endDate);
        }
        const salesData = yield prisma_1.default.transactionItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            where: {
                transaction: whereClause
            }
        });
        const report = yield Promise.all(salesData.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const product = yield prisma_1.default.product.findUnique({
                where: { id: item.productId },
                select: { name: true, price: true, barcode: true, costPrice: true }
            });
            const qty = item._sum.quantity || 0;
            const revenue = qty * ((product === null || product === void 0 ? void 0 : product.price) || 0);
            const cost = qty * ((product === null || product === void 0 ? void 0 : product.costPrice) || 0);
            return {
                productId: item.productId,
                name: (product === null || product === void 0 ? void 0 : product.name) || 'Unknown',
                barcode: (product === null || product === void 0 ? void 0 : product.barcode) || '-',
                quantity: qty,
                unitPrice: (product === null || product === void 0 ? void 0 : product.price) || 0,
                revenue,
                profit: revenue - cost
            };
        })));
        // Sort by revenue descending
        report.sort((a, b) => b.revenue - a.revenue);
        res.json(report);
    }
    catch (error) {
        console.error('Sales Report Error:', error);
        res.status(500).json({ error: 'Failed to fetch sales report' });
    }
});
exports.getSalesReportByProduct = getSalesReportByProduct;
const getDeepSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        // 1. Get transactions for the last 7 days for trends
        const recentTransactions = yield prisma_1.default.transaction.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                status: { not: 'CANCELLED' }
            },
            include: { items: true },
        });
        // 2. Calculate Daily Trends
        const trends = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            trends[d.toISOString().split('T')[0]] = 0;
        }
        recentTransactions.forEach(t => {
            const dateKey = t.createdAt.toISOString().split('T')[0];
            if (trends[dateKey] !== undefined) {
                trends[dateKey] += t.totalAmount;
            }
        });
        // 3. Top Selling Products (All time or filtered)
        const productSales = yield prisma_1.default.transactionItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: 5,
        });
        const topProducts = yield Promise.all(productSales.map((ps) => __awaiter(void 0, void 0, void 0, function* () {
            const product = yield prisma_1.default.product.findUnique({
                where: { id: ps.productId },
                select: { name: true, price: true }
            });
            return {
                name: (product === null || product === void 0 ? void 0 : product.name) || 'Unknown',
                quantity: ps._sum.quantity,
                revenue: (ps._sum.quantity || 0) * ((product === null || product === void 0 ? void 0 : product.price) || 0)
            };
        })));
        // 4. Payment Method Stats
        const paymentStats = yield prisma_1.default.transaction.groupBy({
            by: ['paymentMethod'],
            _sum: {
                totalAmount: true
            },
            where: {
                status: { not: 'CANCELLED' }
            }
        });
        res.json({
            todayRevenue: recentTransactions
                .filter(t => t.createdAt >= today)
                .reduce((sum, t) => sum + t.totalAmount, 0),
            totalTransactionsToday: recentTransactions.filter(t => t.createdAt >= today).length,
            trends: Object.entries(trends).map(([date, amount]) => ({ date, amount })).reverse(),
            topProducts,
            paymentStats,
        });
    }
    catch (error) {
        console.error('Deep Summary Error:', error);
        res.status(500).json({ error: 'Failed to fetch deep summary' });
    }
});
exports.getDeepSummary = getDeepSummary;
const getDailySummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const transactions = yield prisma_1.default.transaction.findMany({
            where: {
                createdAt: {
                    gte: today,
                },
            },
            include: {
                items: true,
            },
        });
        const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalTransactions = transactions.length;
        // Calculate top selling products (simple version)
        const productSales = {};
        // This is a bit inefficient with JS, but okay for small school shops.
        // In production, use prisma.groupBy or a raw query.
        // For now, let's just return basic stats.
        res.json({
            totalRevenue,
            totalTransactions,
            timestamp: new Date(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch daily summary' });
    }
});
exports.getDailySummary = getDailySummary;
//# sourceMappingURL=transactionController.js.map