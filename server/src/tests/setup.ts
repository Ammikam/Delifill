import { config } from 'dotenv';

config({ path: '.env.test', override: true });

if (!process.env.DATABASE_URL?.includes('delifill_test')) {
  throw new Error('Refusing to run tests: DATABASE_URL must point at the delifill_test database');
}