"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const restockController_1 = require("../controllers/restockController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, restockController_1.createRestockBill);
router.get('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminOnly, restockController_1.getRestockBills);
exports.default = router;
//# sourceMappingURL=restockRoutes.js.map