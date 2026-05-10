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
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.default.Pool({
    connectionString,
    ssl: (connectionString === null || connectionString === void 0 ? void 0 : connectionString.includes('neon.tech')) ? { rejectUnauthorized: false } : false
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding data...');
        // Create Categories
        const cat1 = yield prisma.category.upsert({
            where: { name: 'เครื่องเขียน' },
            update: {},
            create: { name: 'เครื่องเขียน' },
        });
        const cat2 = yield prisma.category.upsert({
            where: { name: 'ขนม/เครื่องดื่ม' },
            update: {},
            create: { name: 'ขนม/เครื่องดื่ม' },
        });
        // Create Products
        yield prisma.product.upsert({
            where: { barcode: '8850000000001' },
            update: {},
            create: {
                name: 'สมุดโรงเรียน (เส้นเดี่ยว)',
                barcode: '8850000000001',
                price: 15,
                costPrice: 10,
                stockQty: 50,
                lowStockThreshold: 10,
                isShortcut: true,
                categoryId: cat1.id,
            },
        });
        yield prisma.product.upsert({
            where: { barcode: '8850000000002' },
            update: {},
            create: {
                name: 'ดินสอ 2B',
                barcode: '8850000000002',
                price: 5,
                costPrice: 2,
                stockQty: 100,
                lowStockThreshold: 20,
                isShortcut: true,
                categoryId: cat1.id,
            },
        });
        yield prisma.product.upsert({
            where: { barcode: '8850000000003' },
            update: {},
            create: {
                name: 'น้ำดื่ม 600ml',
                barcode: '8850000000003',
                price: 7,
                costPrice: 4,
                stockQty: 5, // Low stock for testing
                lowStockThreshold: 10,
                isShortcut: true,
                categoryId: cat2.id,
            },
        });
        // Create or Upgrade Admin User
        yield prisma.user.upsert({
            where: { username: 'admin@shoppp.com' },
            update: {
                role: 'ADMIN', // Force upgrade if already exists
            },
            create: {
                username: 'admin@shoppp.com',
                password: 'ADMIN_PASSWORD',
                name: 'คุณครูดูแลระบบ',
                role: 'ADMIN',
            },
        });
        console.log('Seeding finished.');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    yield pool.end();
}));
//# sourceMappingURL=seed.js.map