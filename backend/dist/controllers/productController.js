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
exports.getAllCategories = exports.getProductByBarcode = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield prisma_1.default.product.findMany({
            include: { category: true },
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
exports.getAllProducts = getAllProducts;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    try {
        const product = yield prisma_1.default.product.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});
exports.getProductById = getProductById;
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, barcode, price, costPrice, stockQty, lowStockThreshold, isShortcut, categoryId, image } = req.body;
    try {
        const product = yield prisma_1.default.product.create({
            data: {
                name,
                barcode,
                price,
                costPrice,
                stockQty,
                lowStockThreshold,
                isShortcut,
                categoryId,
                image,
            },
        });
        const ioInstance = req.app.get('io');
        if (ioInstance) {
            ioInstance.emit('productUpdate', { type: 'CREATE', product });
        }
        res.status(201).json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const data = req.body;
    try {
        const product = yield prisma_1.default.product.update({
            where: { id },
            data,
        });
        const ioInstance = req.app.get('io');
        if (ioInstance) {
            ioInstance.emit('productUpdate', { type: 'UPDATE', product });
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    try {
        yield prisma_1.default.product.delete({ where: { id } });
        const ioInstance = req.app.get('io');
        if (ioInstance) {
            ioInstance.emit('productUpdate', { type: 'DELETE', id });
        }
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});
exports.deleteProduct = deleteProduct;
const getProductByBarcode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const barcode = req.params.barcode;
    try {
        const product = yield prisma_1.default.product.findUnique({
            where: { barcode },
            include: { category: true },
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch product by barcode' });
    }
});
exports.getProductByBarcode = getProductByBarcode;
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma_1.default.category.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
exports.getAllCategories = getAllCategories;
//# sourceMappingURL=productController.js.map