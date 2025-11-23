import { Code } from '../../../db/entities/code.entity';
import { Winner } from '../../../db/entities/winner.entity';
import { User, UserRole } from '../../../db/entities/user.entity';
import { AppDataSource } from '../../../db/connect.db';
import { IsNull, Not, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyUsageItem {
  date: string;
  dayLabel: string;
  usedCodes: number;
}

interface RecentActivityItem {
  id: string;
  value: string;
  usedAt: string | null;
  gift: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null;
}

interface OverviewTotals {
  totalCodes: number;
  usedCodes: number;
  availableCodes: number;
  activeUsers: number;
}

export class OverviewService {
  private codeRepository = AppDataSource.getRepository(Code);
  private winnerRepository = AppDataSource.getRepository(Winner);
  private userRepository = AppDataSource.getRepository(User);

  async getSummary() {
    const now = new Date();
    now.setUTCHours(23, 59, 59, 999);
    const weekStart = new Date(now);
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    // Barcha kodlar - CodeModel + WinnerModel
    const [
      totalCodesCount,
      totalWinnersCount,
      usedCodesCount,
      usedWinnersCount,
      availableCodesCount,
      availableWinnersCount,
      activeUsers,
      weeklyUsageRaw,
      recentActivityRaw,
    ] = await Promise.all([
      // Jami kodlar soni (oddiy + g'olib)
      this.codeRepository.count({ where: { deletedAt: IsNull() } as any }),
      this.winnerRepository.count({ where: { deletedAt: IsNull() } as any }),
      // Ishlatilgan kodlar soni (oddiy + g'olib)
      this.codeRepository.count({ where: { deletedAt: IsNull(), isUsed: true, usedAt: Not(IsNull()) } as any }),
      this.winnerRepository.count({ where: { deletedAt: IsNull(), isUsed: true, usedAt: Not(IsNull()) } as any }),
      // Ishlatilmagan kodlar soni (oddiy + g'olib)
      this.codeRepository.count({ where: { deletedAt: IsNull(), isUsed: false } as any }),
      this.winnerRepository.count({ where: { deletedAt: IsNull(), isUsed: false } as any }),
      // Active users (oddiy + g'olib kodlardan gift olganlar)
      this.getActiveUsersCount(),
      // Weekly usage (oddiy + g'olib kodlar)
      this.getWeeklyUsage(weekStart, now),
      // Recent activity (oddiy + g'olib kodlar)
      this.getRecentActivity(10),
    ]);

    // Birlashtirilgan hisoblar
    const totalCodes = totalCodesCount + totalWinnersCount;
    const usedCodes = usedCodesCount + usedWinnersCount;
    const availableCodes = availableCodesCount + availableWinnersCount;

    const weeklyUsage = this.normalizeWeeklyUsage(weeklyUsageRaw, weekStart);
    const recentActivity = this.normalizeRecentActivity(recentActivityRaw);

    const totals: OverviewTotals = {
      totalCodes,
      usedCodes,
      availableCodes,
      activeUsers,
    };

    return {
      totals,
      weeklyUsage,
      recentActivity,
    };
  }

  private async getActiveUsersCount(): Promise<number> {
    // Oddiy kodlardan gift olgan userlar (admin'larsiz)
    const codeUsers = await this.codeRepository
      .createQueryBuilder('code')
      .innerJoin('code.usedBy', 'user')
      .where('code.deletedAt IS NULL')
      .andWhere('code.isUsed = :isUsed', { isUsed: true })
      .andWhere('code.usedAt IS NOT NULL')
      .andWhere('code.giftId IS NOT NULL')
      .andWhere('code.usedById IS NOT NULL')
      .andWhere('user.role NOT IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
      .select('DISTINCT code.usedById', 'userId')
      .getRawMany();

    // G'olib kodlardan gift olgan userlar (admin'larsiz)
    const winnerUsers = await this.winnerRepository
      .createQueryBuilder('winner')
      .innerJoin('winner.usedBy', 'user')
      .where('winner.deletedAt IS NULL')
      .andWhere('winner.isUsed = :isUsed', { isUsed: true })
      .andWhere('winner.usedAt IS NOT NULL')
      .andWhere('winner.giftId IS NOT NULL')
      .andWhere('winner.usedById IS NOT NULL')
      .andWhere('user.role NOT IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
      .select('DISTINCT winner.usedById', 'userId')
      .getRawMany();

    // Birlashtirish va unique userlar sonini topish
    const allUserIds = new Set<string>();
    codeUsers.forEach((u: any) => allUserIds.add(u.userId));
    winnerUsers.forEach((u: any) => allUserIds.add(u.userId));

    return allUserIds.size;
  }

  private async getWeeklyUsage(from: Date, to: Date) {
    // Oddiy kodlar - barcha ishlatilgan kodlarni olish
    const codes = await this.codeRepository.find({
      where: {
        deletedAt: IsNull(),
        isUsed: true,
        usedAt: Not(IsNull()),
      } as any,
      select: { usedAt: true },
    });

    // G'olib kodlar - barcha ishlatilgan kodlarni olish
    const winners = await this.winnerRepository.find({
      where: {
        deletedAt: IsNull(),
        isUsed: true,
        usedAt: Not(IsNull()),
      } as any,
      select: { usedAt: true },
    });

    // UTC bo'yicha sana guruhlash
    const usageMap = new Map<string, number>();
    
    [...codes, ...winners].forEach((item) => {
      if (item.usedAt) {
        const usedDate = new Date(item.usedAt);
        // UTC bo'yicha sana olish
        const year = usedDate.getUTCFullYear();
        const month = String(usedDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(usedDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Faqat hafta oralig'idagi sanalarni qo'shish
        const dateObj = new Date(dateStr + 'T00:00:00Z');
        if (dateObj >= from && dateObj <= to) {
          const existing = usageMap.get(dateStr) || 0;
          usageMap.set(dateStr, existing + 1);
        }
      }
    });

    return Array.from(usageMap.entries()).map(([date, count]) => ({ _id: date, count }));
  }

  private async getRecentActivity(limit: number) {
    // Oddiy kodlar
    const codeActivity = await this.codeRepository.find({
      where: {
        deletedAt: IsNull(),
        isUsed: true,
        usedAt: Not(IsNull()),
      } as any,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        value: true,
        usedAt: true,
        usedBy: {
          _id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          tgFirstName: true,
          tgLastName: true,
          role: true,
        },
        gift: {
          _id: true,
          name: true,
        },
      },
      order: { usedAt: 'DESC' },
      take: limit,
    });

    // G'olib kodlar
    const winnerActivity = await this.winnerRepository.find({
      where: {
        deletedAt: IsNull(),
        isUsed: true,
        usedAt: Not(IsNull()),
      } as any,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        value: true,
        usedAt: true,
        usedBy: {
          _id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          tgFirstName: true,
          tgLastName: true,
          role: true,
        },
        gift: {
          _id: true,
          name: true,
        },
      },
      order: { usedAt: 'DESC' },
      take: limit,
    });

    // Admin'larni filtrlash va birlashtirish
    const filteredCodeActivity = codeActivity.filter(
      (item) => item.usedBy && !['ADMIN', 'SUPER_ADMIN'].includes(item.usedBy.role),
    );
    const filteredWinnerActivity = winnerActivity.filter(
      (item) => item.usedBy && !['ADMIN', 'SUPER_ADMIN'].includes(item.usedBy.role),
    );

    // Birlashtirish va sort qilish (eng yangilari birinchi)
    const allActivity = [...filteredCodeActivity, ...filteredWinnerActivity].sort((a, b) => {
      const aDate = a.usedAt ? new Date(a.usedAt).getTime() : 0;
      const bDate = b.usedAt ? new Date(b.usedAt).getTime() : 0;
      return bDate - aDate;
    });

    return allActivity.slice(0, limit);
  }

  private normalizeWeeklyUsage(raw: { _id: string; count: number }[], from: Date): WeeklyUsageItem[] {
    const usageMap = raw.reduce<Record<string, number>>((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const result: WeeklyUsageItem[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(from);
      day.setUTCDate(from.getUTCDate() + i);
      day.setUTCHours(0, 0, 0, 0);
      const isoDate = day.toISOString().split('T')[0];
      result.push({
        date: isoDate,
        dayLabel: DAY_LABELS[day.getUTCDay()],
        usedCodes: usageMap[isoDate] ?? 0,
      });
    }
    return result;
  }

  private normalizeRecentActivity(raw: any[]): RecentActivityItem[] {
    return raw.map((item) => {
      const user = item.usedBy || null;
      const firstName = user?.firstName || user?.tgFirstName || '';
      const lastName = user?.lastName || user?.tgLastName || '';
      const phoneNumber = user?.phoneNumber || '';
      const gift = item.gift || null;

      return {
        id: item._id?.toString(),
        value: item.value,
        usedAt: item.usedAt ? new Date(item.usedAt).toISOString() : null,
        user: user
          ? {
              id: user._id?.toString(),
              firstName,
              lastName,
              phoneNumber,
            }
          : null,
        gift: gift
          ? {
              id: gift._id?.toString(),
              name: gift.name,
            }
          : null,
      };
    });
  }
}
