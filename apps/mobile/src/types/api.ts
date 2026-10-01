export type Role = 'CUSTOMER' | 'SUPPLIER' | 'DRIVER' | 'ADMIN';

export type SessionUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  customer: { id: string } | null;
  supplier: { id: string; status: string; businessName: string } | null;
  driver: { id: string; supplierId: string } | null;
};

export type Tokens = { accessToken: string; refreshToken: string };
export type AuthResponse = { user: SessionUser; tokens: Tokens & { expiresIn: number } };