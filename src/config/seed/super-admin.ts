export interface SeedSuperAdminConfig {
  username: string;
  password: string;
  firstName: string;
  lastName?: string;
  tgId: number;
  tgFirstName: string;
  tgLastName?: string;
  tgUsername?: string;
  phoneNumber?: string;
  lang?: string;
}

export const DEFAULT_SUPER_ADMIN: SeedSuperAdminConfig = {
  username: 'super_admin',
  password: 'ChangeMe123!',
  firstName: 'Super',
  lastName: 'Admin',
  tgId: 999999999,
  tgFirstName: 'Super',
  tgLastName: 'Admin',
  tgUsername: 'super_admin',
  phoneNumber: '+998901234567',
  lang: 'uz',
};

