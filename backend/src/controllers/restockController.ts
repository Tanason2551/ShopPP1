import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createRestockBill = async (req: AuthRequest, res: Response) => {
  const { note, items } = req.body;
  const userId = req.user?.dbId;

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid input data or unauthorized' });
  }

  try {
    const totalCost = items.reduce((acc: number, item: any) => acc + (item.quantity * item.costPrice), 0);

    const restockBill = await prisma.$transaction(async (tx) => {
      // 1. Create the bill
      const bill = await tx.restockBill.create({
        data: {
          userId,
          totalCost,
          note,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              costPrice: item.costPrice,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update stock for each product and create stock logs
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: { increment: item.quantity },
            costPrice: item.costPrice,
          },
        });

        await tx.stockLog.create({
          data: {
            productId: item.productId,
            changeQty: item.quantity,
            type: 'IN',
            userId,
            note: `Restock Bill: ${bill.id}`,
          },
        });
      }

      return bill;
    });

    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.emit('stockUpdate', { type: 'RESTOCK', restockBill });
      // Also emit product update to sync POS
      ioInstance.emit('productUpdate', { type: 'BULK_UPDATE' });
    }

    res.status(201).json(restockBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create restock bill' });
  }
};

export const getRestockBills = async (req: Request, res: Response) => {
  try {
    const bills = await prisma.restockBill.findMany({
      include: {
        user: { select: { name: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restock bills' });
  }
};
