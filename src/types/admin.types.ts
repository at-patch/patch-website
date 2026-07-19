export type AdminRole = "owner" | "staff";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
