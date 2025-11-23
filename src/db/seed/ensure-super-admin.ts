import bcrypt from 'bcrypt';
import { DEFAULT_SUPER_ADMIN } from '../../config/seed/super-admin';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { AppDataSource } from '../connect.db';
import { IsNull } from 'typeorm';

const SALT_ROUNDS = 10;

export async function ensureSuperAdmin() {
  if (!DEFAULT_SUPER_ADMIN.username || !DEFAULT_SUPER_ADMIN.password) {
    return;
  }

  const userRepository = AppDataSource.getRepository(User);
  const existing = await userRepository.findOne({
    where: {
      username: DEFAULT_SUPER_ADMIN.username,
      role: UserRole.SUPER_ADMIN,
      deletedAt: IsNull(),
    } as any,
  });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_SUPER_ADMIN.password, SALT_ROUNDS);
  const count = await userRepository.count();

  const newUser = userRepository.create({
    id: count + 1,
    username: DEFAULT_SUPER_ADMIN.username,
    password: passwordHash,
    firstName: DEFAULT_SUPER_ADMIN.firstName,
    lastName: DEFAULT_SUPER_ADMIN.lastName ?? '',
    tgId: DEFAULT_SUPER_ADMIN.tgId,
    tgFirstName: DEFAULT_SUPER_ADMIN.tgFirstName,
    tgLastName: DEFAULT_SUPER_ADMIN.tgLastName ?? '',
    tgUsername: DEFAULT_SUPER_ADMIN.tgUsername ?? DEFAULT_SUPER_ADMIN.username,
    phoneNumber: DEFAULT_SUPER_ADMIN.phoneNumber ?? '',
    lang: DEFAULT_SUPER_ADMIN.lang ?? 'uz',
    status: UserStatus.ACTIVE,
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(newUser);
}
