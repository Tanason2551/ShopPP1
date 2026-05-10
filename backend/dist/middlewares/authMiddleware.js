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
exports.adminOnly = exports.authMiddleware = void 0;
const firebase_1 = __importDefault(require("../utils/firebase"));
const prisma_1 = __importDefault(require("../prisma"));
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = yield firebase_1.default.auth().verifyIdToken(idToken);
        // Log for debugging
        console.log(`Token verified for: ${decodedToken.email}`);
        // Find user in our database or create one if it doesn't exist
        let user = yield prisma_1.default.user.findUnique({
            where: { username: decodedToken.email || decodedToken.uid },
        });
        if (!user) {
            // Auto-create user on first login (Optional: adjust according to school policy)
            user = yield prisma_1.default.user.create({
                data: {
                    username: decodedToken.email || decodedToken.uid,
                    password: 'FIREBASE_AUTH', // Not used for Firebase users
                    name: decodedToken.name || 'Unknown User',
                    role: 'STAFF', // Default role
                },
            });
        }
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: user.role,
            dbId: user.id,
        };
        next();
    }
    catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
});
exports.authMiddleware = authMiddleware;
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=authMiddleware.js.map