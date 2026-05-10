import { Request, Response } from 'express';
import prisma from '../prisma';

export const getShopConfig = async (req: Request, res: Response) => {
  try {
    let config = await prisma.shopConfig.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      // Create default if not exists
      config = await prisma.shopConfig.create({
        data: { id: 1 },
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching shop config:', error);
    res.status(500).json({ error: 'Failed to fetch shop config' });
  }
};

export const updateShopConfig = async (req: Request, res: Response) => {
  const { name, address, phone, logo } = req.body;
  try {
    const config = await prisma.shopConfig.upsert({
      where: { id: 1 },
      update: { name, address, phone, logo },
      create: { id: 1, name, address, phone, logo },
    });
    res.json(config);
  } catch (error) {
    console.error('Error updating shop config:', error);
    res.status(500).json({ error: 'Failed to update shop config' });
  }
};
