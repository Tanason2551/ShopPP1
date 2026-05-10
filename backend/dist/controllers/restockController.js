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
exports.getRestockBills = exports.createRestockBill = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createRestockBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { note, items } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.dbId;
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid input data or unauthorized' });
    }
    try {
        const totalCost = items.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
        const restockBill = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Create the bill
            const bill = yield tx.restockBill.create({
                data: {
                    userId,
                    totalCost,
                    note,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                        })),
                    },
                },
                include: { items: true },
            });
            // 2. Update stock for each product and create stock logs
            for (const item of items) {
                yield tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQty: { increment: item.quantity },
                        costPrice: item.costPrice,
                    },
                });
                yield tx.stockLog.create({
                    data: {
                        productId: item.productId,
                        changeQty: item.quantity,
                        type: 'IN',
                        userId,
                        note: `Restock Bill: ${bill.id}`,
                    },
                });
            }
            return bill;
        }));
        const ioInstance = req.app.get('io');
        if (ioInstance) {
            ioInstance.emit('stockUpdate', { type: 'RESTOCK', restockBill });
            // Also emit product update to sync POS
            ioInstance.emit('productUpdate', { type: 'BULK_UPDATE' });
        }
        res.status(201).json(restockBill);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create restock bill' });
    }
});
exports.createRestockBill = createRestockBill;
const getRestockBills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bills = yield prisma_1.default.restockBill.findMany({
            include: {
                user: { select: { name: true } },
                items: {
                    include: { product: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(bills);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch restock bills' });
    }
});
exports.getRestockBills = getRestockBills;
//# sourceMappingURL=restockController.js.map