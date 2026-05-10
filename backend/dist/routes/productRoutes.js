"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// All authenticated users can view products
router.get('/', authMiddleware_1.authMiddleware, productController_1.getAllProducts);
router.get('/categories', authMiddleware_1.authMiddleware, productController_1.getAllCategories);
router.get('/:id', authMiddleware_1.authMiddleware, productController_1.getProductById);
router.get('/barcode/:barcode', authMiddleware_1.authMiddleware, productController_1.getProductByBarcode);
// Only admins can modify products
router.post('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, productController_1.createProduct);
router.put('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, productController_1.updateProduct);
router.delete('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, productController_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map