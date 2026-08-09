import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const settingsSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: { name: 'Mini ERP Pvt. Ltd.' },
      });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = settingsSchema.parse(req.body);
    let profile = await prisma.companyProfile.findFirst();

    if (profile) {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data,
      });
    } else {
      profile = await prisma.companyProfile.create({ data });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};
