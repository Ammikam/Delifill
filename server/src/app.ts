import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { adminRouter } from './modules/admin/admin.routes';
import { authRouter } from './modules/auth/auth.routes';
import { deliveriesRouter } from './modules/deliveries/deliveries.routes';
import { suppliersRouter } from './modules/suppliers/suppliers.routes';
import { healthRouter } from './routes/health';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
app.use(express.json());

app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/suppliers', suppliersRouter);
app.use('/api/v1/deliveries', deliveriesRouter);

app.use(notFoundHandler);
app.use(errorHandler);