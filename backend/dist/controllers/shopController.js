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
exports.updateShopConfig = exports.getShopConfig = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getShopConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let config = yield prisma_1.default.shopConfig.findUnique({
            where: { id: 1 },
        });
        if (!config) {
            // Create default if not exists
            config = yield prisma_1.default.shopConfig.create({
                data: { id: 1 },
            });
        }
        res.json(config);
    }
    catch (error) {
        console.error('Error fetching shop config:', error);
        res.status(500).json({ error: 'Failed to fetch shop config' });
    }
});
exports.getShopConfig = getShopConfig;
const updateShopConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, address, phone, logo } = req.body;
    try {
        const config = yield prisma_1.default.shopConfig.upsert({
            where: { id: 1 },
            update: { name, address, phone, logo },
            create: { id: 1, name, address, phone, logo },
        });
        res.json(config);
    }
    catch (error) {
        console.error('Error updating shop config:', error);
        res.status(500).json({ error: 'Failed to update shop config' });
    }
});
exports.updateShopConfig = updateShopConfig;
//# sourceMappingURL=shopController.js.map