import { z } from 'zod';

const phoneRule = (v: string) => /^(?:\+254|254|0)[17]\d{8}$/.test(v.replace(/[\s-]/g, ''));

const phone = z.string().trim().refine(phoneRule, 'Enter a valid Kenyan phone number');

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100),
  phone,
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email address'),
  password,
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;