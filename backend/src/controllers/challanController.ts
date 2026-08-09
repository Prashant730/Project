import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { ChallanStatus, MovementType } from '@prisma/client';

const challanItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const challanCreateSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(challanItemSchema).min(1),
  taxRate: z.number().min(0).max(100).optional().default(0),
  discount: z.number().min(0).optional().default(0),
});

export const getChallans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as ChallanStatus | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.challanNumber = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.challan.count({ where }),
    ]);

    res.json({
      data: challans,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challans' });
  }
};

export const getChallanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        createdBy: { select: { name: true, email: true } }
      },
    });

    if (!challan) {
      res.status(404).json({ message: 'Challan not found' });
      return;
    }
    res.json(challan);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challan' });
  }
};

const paymentUpdateSchema = z.object({
  amountPaid: z.number().min(0),
});

export const updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amountPaid } = paymentUpdateSchema.parse(req.body);

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!challan) { res.status(404).json({ message: 'Not found' }); return; }

    const subtotal = challan.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const tax = subtotal * (Number(challan.taxRate) / 100);
    const grandTotal = subtotal + tax - Number(challan.discount);

    let paymentStatus = 'UNPAID';
    if (amountPaid >= grandTotal - 0.01) paymentStatus = 'PAID'; // Tolerance for rounding
    else if (amountPaid > 0) paymentStatus = 'PARTIAL';

    const updated = await prisma.challan.update({
      where: { id },
      data: { amountPaid, paymentStatus: paymentStatus as any },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment' });
  }
};

export const createChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = challanCreateSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify Customer
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Verify Products and Create Snapshot
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ message: 'One or more products not found' });
      return;
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    let totalQuantity = 0;
    const challanItemsToCreate = data.items.map(item => {
      const product = productMap.get(item.productId)!;
      const subtotal = Number(product.unitPrice) * item.quantity;
      totalQuantity += item.quantity;

      return {
        productId: product.id,
        productNameSnapshot: product.name,
        productSkuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity,
        subtotal
      };
    });

    // Generate concurrency-safe sequential Challan Number
    const year = new Date().getFullYear();
    const seq = await prisma.sequence.update({
      where: { id: 'challan' },
      data: { value: { increment: 1 } },
    });
    
    // Format: CH-2026-0001
    const challanNumber = `CH-${year}-${seq.value.toString().padStart(4, '0')}`;

    const newChallan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        status: ChallanStatus.DRAFT,
        totalQuantity,
        taxRate: data.taxRate,
        discount: data.discount,
        createdById: userId,
        items: {
          create: challanItemsToCreate
        }
      },
      include: { items: true }
    });

    res.status(201).json(newChallan);
  } catch (error) {
    console.error('Error in createChallan:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
    } else {
      res.status(500).json({ message: 'Error creating challan' });
    }
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!challan) throw new Error('Challan not found');
      if (challan.status !== ChallanStatus.DRAFT) throw new Error('Only DRAFT challans can be confirmed');

      // Process stock deductions atomically
      for (const item of challan.items) {
        // Atomic decrement with condition preventing negative stock
        const updateResult = await tx.$queryRaw`
          UPDATE "Product" 
          SET "currentStock" = "currentStock" - ${item.quantity} 
          WHERE id = ${item.productId} AND "currentStock" >= ${item.quantity}
          RETURNING id;
        `;
        
        // If 0 rows returned, stock was insufficient
        if (Array.isArray(updateResult) && updateResult.length === 0) {
          throw new Error(`Insufficient stock for product snapshot: ${item.productNameSnapshot} (SKU: ${item.productSkuSnapshot})`);
        }

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: MovementType.OUT,
            reason: `Challan Confirmed: ${challan.challanNumber}`,
            createdById: userId,
          }
        });
      }

      const confirmedChallan = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CONFIRMED },
        include: { items: true }
      });

      return confirmedChallan;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error in confirmChallan:', error);
    const msg = error.message.includes('Insufficient stock') || error.message.includes('Only DRAFT') || error.message === 'Challan not found'
      ? error.message 
      : 'Error confirming challan';
    res.status(400).json({ message: msg });
  }
};

export const cancelChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!challan) throw new Error('Challan not found');
      if (challan.status === ChallanStatus.CANCELLED) throw new Error('Challan is already cancelled');

      if (challan.status === ChallanStatus.CONFIRMED) {
        // Need to reverse stock deductions
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.IN,
              reason: `Challan Cancelled: ${challan.challanNumber}`,
              createdById: userId,
            }
          });
        }
      }

      const cancelledChallan = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CANCELLED },
        include: { items: true }
      });

      return cancelledChallan;
    });

    res.json(result);
  } catch (error: any) {
    const msg = error.message === 'Challan not found' || error.message.includes('already cancelled')
      ? error.message 
      : 'Error cancelling challan';
    res.status(400).json({ message: msg });
  }
};
