import { Code } from '../../../db/entities/code.entity';
import { Winner } from '../../../db/entities/winner.entity';
import { UserRole } from '../../../db/entities/user.entity';
import { DashboardGiftCodesDto, DashboardGiftCodeStatus } from '../gift-codes/class-validator';
import { DashboardCodesDto } from './class-validator';
import { AppDataSource } from '../../../db/connect.db';
import { IsNull, Not, In, Like, Or } from 'typeorm';

export class DashboardCodesService {
  private codeRepository = AppDataSource.getRepository(Code);
  private winnerRepository = AppDataSource.getRepository(Winner);

  async getGiftCodes(query: DashboardGiftCodesDto) {
    return this.aggregateGiftReceivers(query);
  }

  async getWinnerCodes() {
    return this.aggregateWinnerCodes();
  }

  private async aggregateWinnerCodes() {
    const where: any = {
      deletedAt: IsNull(),
      isUsed: true,
      usedAt: Not(IsNull()),
    };

    const winners = await this.winnerRepository.find({
      where,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
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
      order: { usedAt: 'DESC', id: 'ASC' },
    });

    // Filter admin users
    const filtered = winners.filter(w => w.usedBy && !['ADMIN', 'SUPER_ADMIN'].includes(w.usedBy.role));

    return filtered.map(this.transformRecord);
  }

  async getCodes(query: DashboardCodesDto) {
    return this.aggregateFromBothCollections(query);
  }

  private async aggregateGiftReceivers(query: DashboardGiftCodesDto) {
    const where: any = {
      deletedAt: IsNull(),
      isUsed: true,
      usedAt: Not(IsNull()),
      giftId: Not(IsNull()),
    };

    if ('giftId' in query && query.giftId) {
      where.giftId = query.giftId;
    }

    const codes = await this.codeRepository.find({
      where,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
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
      order: { usedAt: 'DESC', id: 'ASC' },
    });

    const winners = await this.winnerRepository.find({
      where,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
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
      order: { usedAt: 'DESC', id: 'ASC' },
    });

    // Filter admin users and gift names
    const filteredCodes = codes.filter(c => c.usedBy && !['ADMIN', 'SUPER_ADMIN'].includes(c.usedBy.role));
    const filteredWinners = winners.filter(w => w.usedBy && !['ADMIN', 'SUPER_ADMIN'].includes(w.usedBy.role));
let finalCodes = filteredCodes;
let finalWinners = filteredWinners;

if ('giftNames' in query && Array.isArray((query as any).giftNames) && (query as any).giftNames.length) {
  const giftNames = (query as any).giftNames as string[];
  const giftSet = new Set(giftNames);

  finalCodes = filteredCodes.filter(c => c.gift?.name && giftSet.has(c.gift.name));
  finalWinners = filteredWinners.filter(w => w.gift?.name && giftSet.has(w.gift.name));
}

    // Search filter
    if (query.search) {
      const search = query.search.toLowerCase();
      finalCodes = finalCodes.filter(c => 
        c.value.toLowerCase().includes(search) ||
        c.gift?.name.toLowerCase().includes(search) ||
        (c.usedBy?.firstName || '').toLowerCase().includes(search) ||
        (c.usedBy?.lastName || '').toLowerCase().includes(search) ||
        (c.usedBy?.phoneNumber || '').includes(search)
      );
      finalWinners = finalWinners.filter(w => 
        w.value.toLowerCase().includes(search) ||
        w.gift?.name.toLowerCase().includes(search) ||
        (w.usedBy?.firstName || '').toLowerCase().includes(search) ||
        (w.usedBy?.lastName || '').toLowerCase().includes(search) ||
        (w.usedBy?.phoneNumber || '').includes(search)
      );
    }

    // Combine and sort
    const allResults = [...finalCodes, ...finalWinners].sort((a, b) => {
      const aDate = a.usedAt ? new Date(a.usedAt).getTime() : 0;
      const bDate = b.usedAt ? new Date(b.usedAt).getTime() : 0;
      if (bDate !== aDate) return bDate - aDate;
      return (a.id || 0) - (b.id || 0);
    });

    return allResults.map(this.transformRecord);
  }

  private async aggregateFromBothCollections(query: DashboardCodesDto | DashboardGiftCodesDto) {
    const where: any = {
      deletedAt: IsNull(),
      isUsed: true,
      usedAt: Not(IsNull()),
    };

    if ('giftId' in query && query.giftId) {
      where.giftId = query.giftId;
    }

    // Faqat ishlatilgan kodlarni olish
    const codes = await this.codeRepository.find({
      where,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
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
      order: { id: 'ASC' },
    });

    const winners = await this.winnerRepository.find({
      where,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
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
      order: { id: 'ASC' },
    });

    // Filter admin users - faqat ishlatilgan kodlar
    const filteredCodes = codes.filter(c => c.usedBy && !['ADMIN', 'SUPER_ADMIN'].includes(c.usedBy.role));
    const filteredWinners = winners.filter(w => w.usedBy && !['ADMIN', 'SUPER_ADMIN'].includes(w.usedBy.role));

    // Gift names filter
    let finalCodes = filteredCodes;
    let finalWinners = filteredWinners;
    if ('giftNames' in query && Array.isArray(query.giftNames) && query.giftNames.length) {
      finalCodes = filteredCodes.filter(c => c.gift && query.giftNames.includes(c.gift.name));
      finalWinners = filteredWinners.filter(w => w.gift && query.giftNames.includes(w.gift.name));
    }

    // Search filter
    if (query.search) {
      const search = query.search.toLowerCase();
      finalCodes = finalCodes.filter(c => 
        c.value.toLowerCase().includes(search) ||
        c.gift?.name.toLowerCase().includes(search) ||
        (c.usedBy?.firstName || '').toLowerCase().includes(search) ||
        (c.usedBy?.lastName || '').toLowerCase().includes(search) ||
        (c.usedBy?.phoneNumber || '').includes(search)
      );
      finalWinners = finalWinners.filter(w => 
        w.value.toLowerCase().includes(search) ||
        w.gift?.name.toLowerCase().includes(search) ||
        (w.usedBy?.firstName || '').toLowerCase().includes(search) ||
        (w.usedBy?.lastName || '').toLowerCase().includes(search) ||
        (w.usedBy?.phoneNumber || '').includes(search)
      );
    }

    // Combine and sort - faqat ishlatilgan kodlar
    const allResults = [...finalCodes, ...finalWinners].sort((a, b) => {
      const aDate = new Date(a.usedAt).getTime();
      const bDate = new Date(b.usedAt).getTime();
      if (bDate !== aDate) return bDate - aDate;
      return (a.id || 0) - (b.id || 0);
    });

    return allResults.map(this.transformRecord);
  }

  async searchAll(query: DashboardCodesDto) {
    if (!query.search || !query.search.trim()) {
      return [];
    }

    const searchTerm = query.search.trim().toLowerCase();
    const searchNum = isNaN(Number(searchTerm)) ? null : Number(searchTerm);

    // Users search
    const { User } = await import('../../../db/entities/user.entity');
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      where: [
        {
          deletedAt: IsNull(),
          role: Not(In([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
          firstName: Like(`%${searchTerm}%`),
        },
        {
          deletedAt: IsNull(),
          role: Not(In([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
          lastName: Like(`%${searchTerm}%`),
        },
        {
          deletedAt: IsNull(),
          role: Not(In([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
          phoneNumber: Like(`%${searchTerm}%`),
        },
        {
          deletedAt: IsNull(),
          role: Not(In([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
          tgFirstName: Like(`%${searchTerm}%`),
        },
        {
          deletedAt: IsNull(),
          role: Not(In([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
          tgLastName: Like(`%${searchTerm}%`),
        },
      ] as any,
      take: 50,
    });

    const userIds = users.map(u => u._id);

    // Codes search
    const codesWhereConditions: any[] = [
      { deletedAt: IsNull(), value: Like(`%${searchTerm}%`) },
    ];
    if (searchNum) {
      codesWhereConditions.push({ deletedAt: IsNull(), id: searchNum });
    }
    if (userIds.length) {
      codesWhereConditions.push({ deletedAt: IsNull(), usedById: In(userIds) });
    }

    const codes = await this.codeRepository.find({
      where: codesWhereConditions,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
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
    });

    // Winners search
    const winners = await this.winnerRepository.find({
      where: codesWhereConditions,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
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
    });

    // Filter admin users - faqat ishlatilgan kodlarda, ishlatilmagan kodlar ham ko'rsatiladi
    const filteredCodes = codes.filter(c => !c.usedBy || !['ADMIN', 'SUPER_ADMIN'].includes(c.usedBy.role));
    const filteredWinners = winners.filter(w => !w.usedBy || !['ADMIN', 'SUPER_ADMIN'].includes(w.usedBy.role));

    // Combine and sort
    const allResults = [...filteredCodes, ...filteredWinners].sort((a, b) => {
      const aDate = a.usedAt ? new Date(a.usedAt).getTime() : 0;
      const bDate = b.usedAt ? new Date(b.usedAt).getTime() : 0;
      return bDate - aDate;
    });

    return allResults.map(this.transformRecord);
  }

  private transformRecord(record: any) {
    const gift = record.gift
      ? {
          id: record.gift._id?.toString(),
          name: record.gift.name,
        }
      : null;

    const usedBy = record.usedBy
      ? {
          id: record.usedBy._id?.toString(),
          firstName: record.usedBy.firstName || record.usedBy.tgFirstName || '',
          lastName: record.usedBy.lastName || record.usedBy.tgLastName || '',
          fullName: `${record.usedBy.firstName || record.usedBy.tgFirstName || ''} ${record.usedBy.lastName || record.usedBy.tgLastName || ''}`.trim(),
          phoneNumber: record.usedBy.phoneNumber || '',
        }
      : null;

    return {
      id: record._id?.toString(),
      index: record.id,
      value: record.value,
      gift,
      usedBy,
      usedAt: record.usedAt ? new Date(record.usedAt).toISOString() : null,
      usedAtFormatted: record.usedAt ? new Date(record.usedAt).toISOString().replace('T', ' ').slice(0, 19) : null,
    };
  }
}
