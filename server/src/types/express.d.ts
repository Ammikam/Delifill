import type { AuthUser } from '../middleware/authenticate';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};