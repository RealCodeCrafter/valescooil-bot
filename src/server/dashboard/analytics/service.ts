import { BaseService } from '../../base.service';
import { Code } from '../../../db/entities/code.entity';
import { CodeDto } from '../../codes/class-validator';
import { AppDataSource } from '../../../db/connect.db';
import { IsNull, Not } from 'typeorm';
import { getDateDDMMYYYY } from '../../../common/utility/data-formatter';
import { Gift } from '../../../db/entities/gift.entity';

export class AnalyticsService extends BaseService<Code, CodeDto> {
  private giftRepository = AppDataSource.getRepository(Gift);

  constructor() {
    super(AppDataSource.getRepository(Code));
  }

  async get(from: Date, to: Date) {
    // Ishlatilgan kodlarni olish
    const codes = await this.repository.find({
      where: {
        deletedAt: IsNull(),
        isUsed: true,
        usedAt: Not(IsNull()),
      } as any,
      select: {
        usedAt: true,
        giftId: true,
      },
    });

    // Date range filter
    const filteredCodes = codes.filter((code) => {
      if (!code.usedAt) return false;
      const usedAt = new Date(code.usedAt);
      return usedAt >= from && usedAt <= to;
    });

    // Group by date
    const dateMap = new Map<string, { codesCount: number; codesWithGiftCount: number }>();
    filteredCodes.forEach((code) => {
      if (!code.usedAt) return;
      const date = new Date(code.usedAt);
      date.setUTCHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      const existing = dateMap.get(dateKey) || { codesCount: 0, codesWithGiftCount: 0 };
      existing.codesCount++;
      if (code.giftId) {
        existing.codesWithGiftCount++;
      }
      dateMap.set(dateKey, existing);
    });

    // Sort by date
    const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    const dates = sortedDates.map(([date]) => getDateDDMMYYYY(new Date(date)));
    const codesCount = sortedDates.map(([, data]) => data.codesCount);
    const codesWithGiftCount = sortedDates.map(([, data]) => data.codesWithGiftCount);

    // Pie chart data - gift bo'yicha guruhlash
    const giftMap = new Map<string, number>();
    filteredCodes.forEach((code) => {
      if (code.giftId) {
        const giftId = code.giftId.toString();
        giftMap.set(giftId, (giftMap.get(giftId) || 0) + 1);
      }
    });

    const pieData = await Promise.all(
      Array.from(giftMap.entries()).map(async ([giftId, count]) => {
        const gift = await this.giftRepository.findOne({
          where: { _id: giftId } as any,
          select: { name: true },
        });
        return {
          value: count,
          name: gift?.name || 'Unknown',
        };
      })
    );

    if (dates.length === 0) {
      return {
        dates: [getDateDDMMYYYY(from), getDateDDMMYYYY(to)],
        codesCount: [0],
        codesWithGiftCount: [0],
        pieData: pieData,
      };
    }

    return {
      dates: dates,
      codesCount: codesCount,
      codesWithGiftCount: codesWithGiftCount,
      pieData: pieData,
    };
  }
}

export const analyticsService = new AnalyticsService();
