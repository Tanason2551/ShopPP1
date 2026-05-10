import { Request, Response } from 'express';
import prisma from '../prisma';
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};


export const getProductById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, barcode, price, costPrice, stockQty, lowStockThreshold, isShortcut, categoryId, image } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        barcode,
        price,
        costPrice,
        stockQty,
        lowStockThreshold,
        isShortcut,
        categoryId,
        image,
      },
    });

    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.emit('productUpdate', { type: 'CREATE', product });
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;
  try {
    const product = await prisma.product.update({
      where: { id },
      data,
    });

    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.emit('productUpdate', { type: 'UPDATE', product });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.product.delete({ where: { id } });

    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.emit('productUpdate', { type: 'DELETE', id });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  const barcode = req.params.barcode as string;
  try {
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product by barcode' });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
