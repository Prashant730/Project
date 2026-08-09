// Updated: reviewed and minor improvements (commit group 1)
import { Request, Response } from 'express'
import prisma from '../prisma'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { POStatus, MovementType } from '@prisma/client'

const poItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().min(0),
})

const poCreateSchema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(poItemSchema).min(1),
})

export const getPOs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''
    const status = req.query.status as POStatus | undefined
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.poNumber = { contains: search, mode: 'insensitive' }
    }
    if (status) {
      where.status = status
    }

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    res.json({
      data: pos,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching POs' })
  }
}

export const getPOById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
        createdBy: { select: { name: true } },
      },
    })
    if (!po) {
      res.status(404).json({ message: 'Not found' })
      return
    }
    res.json(po)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching PO' })
  }
}

export const createPO = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = poCreateSchema.parse(req.body)
    const userId = req.user!.id

    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    })
    if (!supplier) {
      res.status(404).json({ message: 'Supplier not found' })
      return
    }

    const productIds = data.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    let totalQuantity = 0
    const itemsToCreate = data.items.map((item) => {
      const p = productMap.get(item.productId)!
      totalQuantity += item.quantity
      return {
        productId: p.id,
        productNameSnapshot: p.name,
        productSkuSnapshot: p.sku,
        unitCostSnapshot: item.unitCost,
        quantity: item.quantity,
        subtotal: item.unitCost * item.quantity,
      }
    })

    const year = new Date().getFullYear()
    let seq = await prisma.sequence.findUnique({ where: { id: 'po' } })
    if (!seq) {
      seq = await prisma.sequence.create({ data: { id: 'po', value: 0 } })
    }
    seq = await prisma.sequence.update({
      where: { id: 'po' },
      data: { value: { increment: 1 } },
    })
    const poNumber = `PO-${year}-${seq.value.toString().padStart(4, '0')}`

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        status: POStatus.DRAFT,
        totalQuantity,
        createdById: userId,
        items: { create: itemsToCreate },
      },
      include: { items: true },
    })
    res.status(201).json(po)
  } catch (error) {
    res.status(400).json({ message: 'Error creating PO' })
  }
}

export const confirmPO = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string
    const userId = req.user!.id

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!po || po.status !== POStatus.DRAFT)
        throw new Error('Invalid PO state')

      for (const item of po.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: MovementType.IN,
            reason: `Purchase Order ${po.poNumber} Confirmed`,
            createdById: userId,
          },
        })
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: POStatus.CONFIRMED },
      })
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ message: 'Error confirming PO' })
  }
}

export const cancelPO = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string
    const userId = req.user!.id

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!po || po.status === POStatus.CANCELLED)
        throw new Error('Invalid PO state')

      if (po.status === POStatus.CONFIRMED) {
        for (const item of po.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          })
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.OUT,
              reason: `Purchase Order ${po.poNumber} Cancelled`,
              createdById: userId,
            },
          })
        }
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: POStatus.CANCELLED },
      })
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ message: 'Error canceling PO' })
  }
}
