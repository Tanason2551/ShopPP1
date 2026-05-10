"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware, categoryController_1.getAllCategories);
router.post('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, categoryController_1.createCategory);
router.put('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, categoryController_1.updateCategory);
router.delete('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, categoryController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map