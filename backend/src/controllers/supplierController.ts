// Updated: reviewed and minor improvements (commit group 1)
import { Request, Response } from 'express'
import prisma from '../prisma'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'

const supplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
})

export const getSuppliers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.count({ where }),
    ])

    res.json({
      data: suppliers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers' })
  }
}

export const getSupplierById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { purchaseOrders: true },
    })
    if (!supplier) {
      res.status(404).json({ message: 'Not found' })
      return
    }
    res.json(supplier)
  } catch (error) {
    res.status(500).json({ message: 'Error' })
  }
}

export const createSupplier = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = supplierSchema.parse(req.body)
    const userId = req.user!.id
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        email: data.email || null,
        createdById: userId,
      },
    })
    res.status(201).json(supplier)
  } catch (error) {
    res.status(400).json({ message: 'Invalid input' })
  }
}

export const updateSupplier = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string
    const data = supplierSchema.parse(req.body)

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ message: 'Not found' })
      return
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        email: data.email || null,
      },
    })
    res.json(updated)
  } catch (error) {
    res.status(400).json({ message: 'Invalid input' })
  }
}
