import { Request, Response, NextFunction } from 'express';
import admin from '../utils/firebase';
import prisma from '../prisma';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: string;
    dbId: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  // Bypass for debug token
  if (idToken === 'debug-token') {
    let user = await prisma.user.findUnique({
      where: { username: 'admin@shoppp.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: 'admin@shoppp.com',
          password: 'DEBUG_PASSWORD',
          name: 'Debug Admin',
          role: 'ADMIN',
        },
      });
    }

    req.user = {
      uid: 'debug-uid',
      email: 'admin@shoppp.com',
      role: user.role,
      dbId: user.id,
    };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Log for debugging
    console.log(`Token verified for: ${decodedToken.email}`);
    
    // Find user in our database or create one if it doesn't exist
    let user = await prisma.user.findUnique({
      where: { username: decodedToken.email || decodedToken.uid },
    });

    if (!user) {
      // Auto-create user on first login (Optional: adjust according to school policy)
      user = await prisma.user.create({
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
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};
