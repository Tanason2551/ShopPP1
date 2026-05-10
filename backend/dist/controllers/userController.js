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
exports.deleteUser = exports.updateUser = exports.updateUserRole = exports.createUser = exports.getAllUsers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const firebase_1 = __importDefault(require("../utils/firebase"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
exports.getAllUsers = getAllUsers;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        // 1. Create user in Firebase Auth
        const firebaseUser = yield firebase_1.default.auth().createUser({
            email,
            password,
            displayName: name,
        });
        // 2. Create user in our Database
        const user = yield prisma_1.default.user.create({
            data: {
                username: email,
                password: 'FIREBASE_AUTH', // We don't store plain passwords
                name,
                role: role || 'STAFF',
            },
        });
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create user' });
    }
});
exports.createUser = createUser;
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { role } = req.body;
    if (!['ADMIN', 'STAFF'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        const user = yield prisma_1.default.user.update({
            where: { id },
            data: { role },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
exports.updateUserRole = updateUserRole;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { name, password, role } = req.body;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Update in Database
        const updatedUser = yield prisma_1.default.user.update({
            where: { id },
            data: {
                name: name || undefined,
                role: role || undefined,
            },
        });
        // If password provided, update in Firebase
        if (password) {
            const firebaseUser = yield firebase_1.default.auth().getUserByEmail(user.username);
            yield firebase_1.default.auth().updateUser(firebaseUser.uid, {
                password: password,
                displayName: name || user.name,
            });
        }
        else if (name) {
            // If only name provided, update displayName in Firebase
            try {
                const firebaseUser = yield firebase_1.default.auth().getUserByEmail(user.username);
                yield firebase_1.default.auth().updateUser(firebaseUser.uid, {
                    displayName: name,
                });
            }
            catch (e) {
                console.error('Failed to update name in Firebase:', e);
            }
        }
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ error: error.message || 'Failed to update user' });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Delete from database
        yield prisma_1.default.user.delete({ where: { id } });
        // Optional: Also delete from Firebase if you want full removal
        // try {
        //   const firebaseUser = await admin.auth().getUserByEmail(user.username);
        //   await admin.auth().deleteUser(firebaseUser.uid);
        // } catch (e) {
        //   console.error('Failed to delete from Firebase:', e);
        // }
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.deleteUser = deleteUser;
//# sourceMappingURL=userController.js.map