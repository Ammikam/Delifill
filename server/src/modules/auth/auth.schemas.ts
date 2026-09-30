import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(?:\+254|254|0)[17]\d{8}$/, 'Enter a valid Kenyan phone number'))
  .transform((s) => `+254${s.slice(-9)}`);

const email = z.string().trim().toLowerCase().email();

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const registerCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone,
  email: email.optional(),
  password,
});

export const registerSupplierSchema = registerCustomerSchema.extend({
  businessName: z.string().trim().min(2).max(120),
  businessPhone: phone.optional(),
  address: z.string().trim().min(5).max(200),
});

export const loginSchema = z.object({ phone, password: z.string().min(1) });
export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export const forgotPasswordSchema = z.object({ phone });
export const resetPasswordSchema = z.object({ token: z.string().min(1), password });

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type RegisterSupplierInput = z.infer<typeof registerSupplierSchema>;