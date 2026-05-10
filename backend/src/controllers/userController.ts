import { Request, Response } from 'express';
import prisma from '../prisma';
import admin from '../utils/firebase';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Create user in Firebase Auth
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create user in our Database
    const user = await prisma.user.create({
      data: {
        username: email,
        password: 'FIREBASE_AUTH', // We don't store plain passwords
        name,
        role: role || 'STAFF',
      },
    });

    res.status(201).json(user);
  } catch (error: any) {
    console.error('Create User Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { role } = req.body;

  if (!['ADMIN', 'STAFF'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, password, role } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update in Database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        role: role || undefined,
      },
    });

    // If password provided, update in Firebase
    if (password) {
      const firebaseUser = await admin.auth().getUserByEmail(user.username);
      await admin.auth().updateUser(firebaseUser.uid, {
        password: password,
        displayName: name || user.name,
      });
    } else if (name) {
      // If only name provided, update displayName in Firebase
      try {
        const firebaseUser = await admin.auth().getUserByEmail(user.username);
        await admin.auth().updateUser(firebaseUser.uid, {
          displayName: name,
        });
      } catch (e) {
        console.error('Failed to update name in Firebase:', e);
      }
    }

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Update User Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete from database
    await prisma.user.delete({ where: { id } });

    // Optional: Also delete from Firebase if you want full removal
    // try {
    //   const firebaseUser = await admin.auth().getUserByEmail(user.username);
    //   await admin.auth().deleteUser(firebaseUser.uid);
    // } catch (e) {
    //   console.error('Failed to delete from Firebase:', e);
    // }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
