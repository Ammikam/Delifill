import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate, requireUser } from '../../middleware/authenticate';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerCustomerSchema,
  registerSupplierSchema,
  resetPasswordSchema,
} from './auth.schemas';
import * as auth from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/register/customer',
  asyncHandler(async (req, res) => {
    const input = registerCustomerSchema.parse(req.body);
    res.status(201).json(await auth.registerCustomer(input));
  }),
);

authRouter.post(
  '/register/supplier',
  asyncHandler(async (req, res) => {
    const input = registerSupplierSchema.parse(req.body);
    res.status(201).json(await auth.registerSupplier(input));
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    res.json(await auth.login(input.phone, input.password));
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const input = refreshSchema.parse(req.body);
    res.json({ tokens: await auth.refreshSession(input.refreshToken) });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const input = refreshSchema.parse(req.body);
    await auth.logout(input.refreshToken);
    res.status(204).end();
  }),
);

authRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const input = forgotPasswordSchema.parse(req.body);
    await auth.requestPasswordReset(input.phone);
    res.status(202).json({ message: 'If that number is registered, a reset code has been sent.' });
  }),
);

authRouter.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const input = resetPasswordSchema.parse(req.body);
    await auth.resetPassword(input.token, input.password);
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: await auth.getSessionUser(requireUser(req).id) });
  }),
);