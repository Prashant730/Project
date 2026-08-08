import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { CustomerType, CustomerStatus } from '@prisma/client';

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(1),
  email: z.string().email().optional().nullable(),
  businessName: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  customerType: z.nativeEnum(CustomerType).optional(),
  address: z.string().optional().nullable(),
  status: z.nativeEnum(CustomerStatus).optional(),
  followUpDate: z.string().optional().nullable(),
  notes: z.array(z.object({
    note: z.string()
  })).optional(),
});

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { mobile: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          notes: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } } },
    });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = customerSchema.parse(req.body);
    const userId = req.user!.id;

    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        createdById: userId,
        notes: data.notes && data.notes.length > 0 ? {
          create: data.notes.map(n => ({
            note: n.note,
            createdById: userId,
          }))
        } : undefined
      },
      include: { notes: true },
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
    } else {
      res.status(500).json({ message: 'Error creating customer' });
    }
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = customerSchema.parse(req.body);
    const userId = req.user!.id;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes && data.notes.length > 0 ? {
          create: data.notes.map(n => ({
            note: n.note,
            createdById: userId,
          }))
        } : undefined
      },
      include: { notes: true },
    });

    res.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.issues });
    } else {
      res.status(500).json({ message: 'Error updating customer' });
    }
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customer' });
  }
};
