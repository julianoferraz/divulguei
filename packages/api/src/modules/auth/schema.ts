import { z } from 'zod';

export const requestCodeSchema = z.object({
  phone: z.string().min(10).max(20).regex(/^\d+$/, 'Telefone deve conter apenas números'),
});

export const verifyCodeSchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
});

export const googleAuthSchema = z.object({
  token: z.string().min(1),
});
