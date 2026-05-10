"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, userController_1.getAllUsers);
router.post('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, userController_1.createUser);
router.put('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, userController_1.updateUser);
router.put('/:id/role', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, userController_1.updateUserRole);
router.delete('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map