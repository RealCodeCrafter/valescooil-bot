import { DashboardClientPagingDto } from './class-validator';
import { User, UserRole } from '../../../db/entities/user.entity';
import { AppDataSource } from '../../../db/connect.db';
import { IsNull, Not, In, Like, MoreThanOrEqual, LessThanOrEqual, Or } from 'typeorm';
import { Code } from '../../../db/entities/code.entity';
import { Winner } from '../../../db/entities/winner.entity';

export class DashboardClientService {
  private userRepository = AppDataSource.getRepository(User);
  private codeRepository = AppDataSource.getRepository(Code);
  private winnerRepository = AppDataSource.getRepository(Winner);

  async getClients(query: DashboardClientPagingDto) {
    const where: any = {
      deletedAt: IsNull(),
      role: Not(In([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    };

    if (query.firstName) {
      where.firstName = Like(`%${query.firstName}%`);
    }
    if (query.lastName) {
      where.lastName = Like(`%${query.lastName}%`);
    }
    if (query.phoneNumber) {
      where.phoneNumber = Like(`%${query.phoneNumber}%`);
    }

    if (query.registeredFrom || query.registeredTo) {
      where.createdAt = {};
      if (query.registeredFrom) {
        where.createdAt = MoreThanOrEqual(new Date(query.registeredFrom));
      }
      if (query.registeredTo) {
        const to = new Date(query.registeredTo);
        to.setUTCHours(23, 59, 59, 999);
        where.createdAt = LessThanOrEqual(to);
      }
    }

const whereConditions: any = {};

if (query.search) {
  whereConditions["OR"] = [
    { firstName: Like(`%${query.search}%`) },
    { lastName: Like(`%${query.search}%`) },
    { phoneNumber: Like(`%${query.search}%`) },
  ];
}


    const users = await this.userRepository.find({
      where,
      select: {
        _id: true,
        firstName: true,
        lastName: true,
        tgFirstName: true,
        tgLastName: true,
        phoneNumber: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });

    // Gifts count hisoblash
    const usersWithGifts = await Promise.all(
      users.map(async (user) => {
        const [codes, winners] = await Promise.all([
          this.codeRepository.find({
            where: { usedById: user._id, deletedAt: IsNull(), isUsed: true, usedAt: Not(IsNull()), giftId: Not(IsNull()) } as any,
            select: { giftId: true },
          }),
          this.winnerRepository.find({
            where: { usedById: user._id, deletedAt: IsNull(), isUsed: true, usedAt: Not(IsNull()), giftId: Not(IsNull()) } as any,
            select: { giftId: true },
          }),
        ]);

        const giftsCount = codes.filter(c => c.giftId).length + winners.filter(w => w.giftId).length;

        // Gift count filter
        if (typeof query.minGifts === 'number' && giftsCount < query.minGifts) return null;
        if (typeof query.maxGifts === 'number' && giftsCount > query.maxGifts) return null;

        return {
          _id: user._id,
          firstName: user.firstName || user.tgFirstName || '',
          lastName: user.lastName || user.tgLastName || '',
          phoneNumber: user.phoneNumber || '',
          giftsCount,
          createdAt: user.createdAt,
        };
      })
    );

    const filtered = usersWithGifts.filter(u => u !== null);

    return filtered;
  }
}
