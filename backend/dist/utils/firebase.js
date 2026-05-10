"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (serviceAccountPath) {
            // Resolve path to make sure it works regardless of where the command is run from
            const fullPath = path_1.default.isAbsolute(serviceAccountPath)
                ? serviceAccountPath
                : path_1.default.join(process.cwd(), serviceAccountPath);
            if (fs_1.default.existsSync(fullPath)) {
                admin.initializeApp({
                    credential: admin.credential.cert(fullPath),
                });
                console.log('✅ Firebase Admin: Initialized successfully using:', fullPath);
            }
            else {
                console.error('❌ Firebase Admin Error: Service account file NOT found at:', fullPath);
                console.error('Please check GOOGLE_APPLICATION_CREDENTIALS in your .env file');
            }
        }
        else {
            console.error('❌ Firebase Admin Error: GOOGLE_APPLICATION_CREDENTIALS is not set in .env');
        }
    }
    catch (error) {
        console.error('💥 Firebase Admin initialization error:', error);
    }
}
exports.default = admin;
//# sourceMappingURL=firebase.js.map