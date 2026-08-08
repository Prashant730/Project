import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { MovementType } from '@prisma/client';

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional().nullable(),
  unitPrice: z.number().positive(),
  currentStock: z.number().int().min(0).optional(),
  minStockAlert: z.number().int().min(0).optional(),
  location: z.string().optional().nullable(),
});

const stockMovementSchema = z.object({
  quantity: z.number().int().positive(),
  movementType: z.nativeEnum(MovementType),
  reason: z.string().optional().nullable(),
});

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';

    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { createdBy: { select: { name: true } } }
        }
      },
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = productSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if SKU exists
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      res.status(400).json({ message: 'Product with this SKU already exists' });
      return;
    }

    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice,
        currentStock: data.currentStock || 0,
        minStockAlert: data.minStockAlert !== undefined ? data.minStockAlert : 10,
        location: data.location,
        createdById: userId,
        // If initial stock is > 0, we can record an initial movement
        ...(data.currentStock && data.currentStock > 0 ? {
          stockMovements: {
            create: {
              quantity: data.currentStock,
              movementType: MovementType.IN,
              reason: 'Initial Stock',
              createdById: userId,
            }
          }
        } : {})
      },
    });

    res.status(201).json(newProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
    } else {
      res.status(500).json({ message: 'Error creating product' });
    }
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = productSchema.parse(req.body);

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Check SKU collision
    if (data.sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (skuCheck) {
        res.status(400).json({ message: 'Product with this SKU already exists' });
        return;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice,
        minStockAlert: data.minStockAlert,
        location: data.location,
        // Intentionally not updating currentStock directly here, should use addStockMovement
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
    } else {
      res.status(500).json({ message: 'Error updating product' });
    }
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Deleting a product with movements or challans will fail due to foreign key constraints
    // This is intentional to preserve historical data integrity. 
    // In a real scenario, you'd mark it INACTIVE, but we'll try a hard delete first.
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Cannot delete product that has associated historical records (movements/challans).' });
  }
};

export const addStockMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = stockMovementSchema.parse(req.body);
    const userId = req.user!.id;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        throw new Error('Product not found');
      }

      const isOut = data.movementType === MovementType.OUT;
      
      if (isOut && product.currentStock < data.quantity) {
        throw new Error('Insufficient stock for this movement');
      }

      const stockModifier = isOut ? -data.quantity : data.quantity;
      const newStock = product.currentStock + stockModifier;

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          quantity: data.quantity,
          movementType: data.movementType,
          reason: data.reason,
          createdById: userId,
        }
      });

      return { product: updatedProduct, movement };
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
    } else {
      const msg = error.message === 'Insufficient stock for this movement' || error.message === 'Product not found' 
        ? error.message : 'Error adding stock movement';
      res.status(400).json({ message: msg });
    }
  }
};
