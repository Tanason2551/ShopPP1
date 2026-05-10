"use strict";
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
if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined in .env file');
}
// Create the connection pool for PostgreSQL (Neon)
const pool = new pg_1.default.Pool({
    connectionString,
    ssl: (connectionString === null || connectionString === void 0 ? void 0 : connectionString.includes('neon.tech')) ? { rejectUnauthorized: false } : false
});
const adapter = new adapter_pg_1.PrismaPg(pool);
// Pass the adapter to PrismaClient
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
//# sourceMappingURL=prisma.js.map