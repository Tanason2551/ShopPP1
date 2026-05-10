import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { verifyFirebasePassword } from '../utils/firebaseVerify';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  const { totalAmount, paymentMethod, receivedAmount, changeAmount, items } = req.body;
  const userId = req.user?.dbId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Transaction
      const transaction = await tx.transaction.create({
        data: {
          totalAmount,
          paymentMethod,
          receivedAmount,
          changeAmount,
          userId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });

      // 2. Update stock for each product
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) throw new Error(`ไม่พบสินค้าไอดี: ${item.productId}`);
        if (product.stockQty < item.quantity) {
          throw new Error(`สินค้า "${product.name}" มีสต็อกไม่เพียงพอ (เหลือ ${product.stockQty} ชิ้น)`);
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              decrement: item.quantity
            }
          }
        });

        // 3. Create Stock Log (OUT)
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            changeQty: item.quantity,
            type: 'OUT',
            userId: userId,
            note: `Transaction ${transaction.id}`
          }
        });
      }

      return transaction;
    });

    // Emit real-time update if socket.io is available
    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.emit('newTransaction', result);
    }

    // Return the full transaction with items for the frontend
    const fullTransaction = await prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        items: { include: { product: true } }
      }
    });

    res.status(201).json(fullTransaction);
  } catch (error: any) {
    console.error('Transaction error:', error);
    const errorMessage = error.message || 'เกิดข้อผิดพลาดในการชำระเงิน';
    res.status(400).json({ error: errorMessage });
  }
};

export const cancelTransaction = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { password } = req.body;
  const userEmail = req.user?.email;
  const userId = req.user?.dbId;

  console.log(`[CANCEL] Attempting to cancel transaction: ${id}`);
  console.log(`[CANCEL] Operator: ${userEmail}`);

  if (!userEmail || !userId) {
    return res.status(401).json({ error: 'User not identified' });
  }

  // 1. Verify Password with Firebase
  const firebaseUser = await verifyFirebasePassword(userEmail, password);
  if (!firebaseUser) {
    return res.status(403).json({ error: 'รหัสผ่านไม่ถูกต้อง (กรุณาใช้รหัสผ่าน Firebase ของคุณ)' });
  }

  // 2. Check if user has ADMIN role in our DB
  const dbUser = await prisma.user.findUnique({
    where: { username: userEmail }
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการยกเลิกบิล (ต้องเป็นแอดมินเท่านั้น)' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get Transaction with items
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!transaction) throw new Error('ไม่พบรายการขาย');
      if (transaction.status === 'CANCELLED') throw new Error('รายการนี้ถูกยกเลิกไปแล้ว');

      // 2. Restore Stock
      for (const item of transaction.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              increment: item.quantity,
            },
          },
        });

        // 3. Create Stock Log (IN)
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            changeQty: item.quantity,
            type: 'IN',
            userId: userId,
            note: `CANCELLED Transaction ${transaction.id}`,
          },
        });
      }

      // 4. Update Transaction Status
      return await tx.transaction.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
    });

    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.emit('transactionCancelled', { id, result });
    }

    res.json({ message: 'ยกเลิกรายการสำเร็จ และคืนสต็อกเรียบร้อยแล้ว', result });
  } catch (error: any) {
    console.error('[CANCEL] Error during transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel transaction' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: { select: { name: true, username: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getDailySummary = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' }
      },
    });

    const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalTransactions = transactions.length;

    res.json({
      totalRevenue,
      totalTransactions,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error in getDailySummary:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
};

export const getDeepSummary = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Get transactions for the last 7 days for trends
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { not: 'CANCELLED' }
      },
      include: { items: true },
    });

    // 2. Calculate Daily Trends
    const trends: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trends[d.toISOString().split('T')[0]] = 0;
    }

    recentTransactions.forEach(t => {
      const dateKey = t.createdAt.toISOString().split('T')[0];
      if (trends[dateKey] !== undefined) {
        trends[dateKey] += t.totalAmount;
      }
    });

    // 3. Top Selling Products
    const productSales = await prisma.transactionItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProducts = await Promise.all(productSales.map(async (ps) => {
      const product = await prisma.product.findUnique({
        where: { id: ps.productId },
        select: { name: true, price: true }
      });
      return {
        name: product?.name || 'Unknown',
        quantity: ps._sum.quantity,
        revenue: (ps._sum.quantity || 0) * (product?.price || 0)
      };
    }));

    // 4. Payment Method Stats
    const paymentStats = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      _sum: {
        totalAmount: true
      },
      where: {
        status: { not: 'CANCELLED' }
      }
    });

    res.json({
      todayRevenue: recentTransactions
        .filter(t => t.createdAt >= today)
        .reduce((sum, t) => sum + t.totalAmount, 0),
      totalTransactionsToday: recentTransactions.filter(t => t.createdAt >= today).length,
      trends: Object.entries(trends).map(([date, amount]) => ({ date, amount })).reverse(),
      topProducts,
      paymentStats,
    });
  } catch (error) {
    console.error('Deep Summary Error:', error);
    res.status(500).json({ error: 'Failed to fetch deep summary' });
  }
};

export const getSalesReportByProduct = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause: any = { status: { not: 'CANCELLED' } };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const salesData = await prisma.transactionItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      where: {
        transaction: whereClause
      }
    });

    const report = await Promise.all(salesData.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, price: true, barcode: true, costPrice: true }
      });

      const qty = item._sum.quantity || 0;
      const revenue = qty * (product?.price || 0);
      const cost = qty * (product?.costPrice || 0);

      return {
        productId: item.productId,
        name: product?.name || 'Unknown',
        barcode: product?.barcode || '-',
        quantity: qty,
        unitPrice: product?.price || 0,
        revenue,
        profit: revenue - cost
      };
    }));

    // Sort by revenue descending
    report.sort((a, b) => b.revenue - a.revenue);

    res.json(report);
  } catch (error) {
    console.error('Sales Report Error:', error);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};
