import { Repository, In, Like, IsNull, Not } from 'typeorm';
import { PagingDto } from '../../common/validation/dto/paging.dto';
import { Code } from '../../db/entities/code.entity';
import { BaseService } from '../base.service';
import { CodeDto, CodePagingDto } from './class-validator';
import { CodeException } from './error';
import { Gift } from '../../db/entities/gift.entity';
import { QuerySort } from '../../common/validation/types';
import { Winner } from '../../db/entities/winner.entity';
import { AppDataSource } from '../../db/connect.db';
import { User } from '../../db/entities/user.entity';

type GiftTier = 'premium' | 'standard' | 'economy' | 'symbolic';

// Bazadan g'olib kodlarni olish (WinnerModel dan)
const norm = (s: string) => (s || '').trim().toUpperCase().replace(/-/g, '');

export class CodeService extends BaseService<Code, CodeDto> {
  private giftRepository: Repository<Gift>;
  private winnerRepository: Repository<Winner>;
  private userRepository: Repository<User>;

  constructor() {
    super(AppDataSource.getRepository(Code));
    this.giftRepository = AppDataSource.getRepository(Gift);
    this.winnerRepository = AppDataSource.getRepository(Winner);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async codeGiftGive(codeId: string, giftGivenBy: string) {
    const code = await this.findByIdAndUpdate(
      codeId,
      {
        giftGivenBy: giftGivenBy,
        giftGivenAt: new Date(),
      } as any,
    );
    if (!code) throw CodeException.NotFound();
    
    // month fieldni olib tashlaymiz
    const { month, ...result } = code as any;
    return result;
  }

  async resetCodeUsage(codeId: string) {
    const code = await this.findByIdAndUpdate(
      codeId,
      {
        isUsed: false,
        usedAt: null,
        usedById: null,
      } as any,
    );
    if (!code) throw CodeException.NotFound();
    
    // month fieldni olib tashlaymiz
    const { month, ...result } = code as any;
    return result;
  }

  async resetWinnerCodeUsage(winnerId: string) {
    const winner = await this.winnerRepository.findOne({ where: { _id: winnerId } as any });
    if (!winner) throw CodeException.NotFound();
    
    await this.winnerRepository.update(
      { _id: winnerId } as any,
      {
        isUsed: false,
        usedAt: null,
        usedById: null,
      } as any,
    );
    
    const updated = await this.winnerRepository.findOne({ 
      where: { _id: winnerId } as any,
      relations: ['gift', 'usedBy'],
    });
    
    if (!updated) throw CodeException.NotFound();
    
    // month fieldni olib tashlaymiz
    const { month, ...result } = updated as any;
    return result;
  }

  async resetCodeUsageByValue(value: string) {
    const normalized = norm(value);
    const withHyphen = normalized.length === 10 ? `${normalized.slice(0, 6)}-${normalized.slice(6)}` : normalized;
    
    const code = await this.repository.findOne({
      where: [
        { value: value, deletedAt: IsNull() },
        { value: withHyphen, deletedAt: IsNull() },
        { value: normalized, deletedAt: IsNull() },
        { value: value.replace(/-/g, ''), deletedAt: IsNull() },
      ] as any,
    });
    
    if (!code) throw CodeException.NotFound();
    
    await this.repository.update(
      { _id: code._id } as any,
      {
        isUsed: false,
        usedAt: null,
        usedById: null,
      } as any,
    );
    
    const updated = await this.repository.findOne({ 
      where: { _id: code._id } as any,
      relations: ['gift', 'usedBy'],
    });
    
    if (!updated) throw CodeException.NotFound();
    
    // month fieldni olib tashlaymiz
    const { month, ...result } = updated as any;
    return result;
  }

  async resetWinnerCodeUsageByValue(value: string) {
    const normalized = norm(value);
    const withHyphen = normalized.length === 10 ? `${normalized.slice(0, 6)}-${normalized.slice(6)}` : normalized;
    
    const winner = await this.winnerRepository.findOne({
      where: [
        { value: value, deletedAt: IsNull() },
        { value: withHyphen, deletedAt: IsNull() },
        { value: normalized, deletedAt: IsNull() },
        { value: value.replace(/-/g, ''), deletedAt: IsNull() },
      ] as any,
    });
    
    if (!winner) throw CodeException.NotFound();
    
    await this.winnerRepository.update(
      { _id: winner._id } as any,
      {
        isUsed: false,
        usedAt: null,
        usedById: null,
      } as any,
    );
    
    const updated = await this.winnerRepository.findOne({ 
      where: { _id: winner._id } as any,
      relations: ['gift', 'usedBy'],
    });
    
    if (!updated) throw CodeException.NotFound();
    
    // month fieldni olib tashlaymiz
    const { month, ...result } = updated as any;
    return result;
  }

  async getAll(query: CodePagingDto): Promise<CodeDto[]> {
    const where: any = { deletedAt: IsNull() };

    if (query.isUsed === true || query.isUsed === false) {
      where.usedAt = query.isUsed ? Not(IsNull()) : IsNull();
    }

    if (query.search) {
      const searchNum = parseInt(query.search);
      if (!isNaN(searchNum)) {
        where.id = searchNum;
      } else {
        where.value = Like(`%${query.search}%`);
      }
    }

    if (query.giftId) {
      if (query.giftId === 'withGift') {
        where.giftId = Not(IsNull());
      } else {
        where.giftId = query.giftId;
      }
    }

    const data = await this.repository.find({
      where,
      relations: ['gift', 'usedBy'],
      select: {
        _id: true,
        id: true,
        value: true,
        giftId: true,
        isUsed: true,
        usedAt: true,
        usedById: true,
        gift: {
          _id: true,
          id: true,
          name: true,
          image: true,
          images: true,
          totalCount: true,
          usedCount: true,
              },
        usedBy: {
          _id: true,
          tgId: true,
          tgFirstName: true,
          tgLastName: true,
          firstName: true,
          phoneNumber: true,
      },
      },
      order: { usedAt: 'DESC', id: 'ASC' },
    });

    return data as any;
  }

  async getUsedByUser(query: PagingDto, usedById: string): Promise<CodeDto[]> {
    const where: any = {
      deletedAt: IsNull(),
      usedById: usedById,
    };

    if (query.search) {
      const searchNum = parseInt(query.search);
      if (!isNaN(searchNum)) {
        where.id = searchNum;
      } else {
        where.value = Like(`%${query.search}%`);
      }
    }

    const orderType = query.orderType === 'ASC' ? 'ASC' : 'DESC';
    const orderBy = query.orderBy || 'id';
    const order: any = { [orderBy]: orderType };

    const data = await this.repository.find({
      where,
      relations: ['gift'],
      select: {
        _id: true,
        id: true,
        value: true,
        giftId: true,
        isUsed: true,
        usedAt: true,
        usedById: true,
        gift: {
          _id: true,
          id: true,
          name: true,
          image: true,
          images: true,
          type: true,
          totalCount: true,
          usedCount: true,
            },
          },
      order,
    });

    return data as any;
  }

  async checkCode(value: string) {
    const code = await this.findOne(
      { value: value, deletedAt: IsNull() } as any,
      { value: true, giftId: true },
    );
    if (!code) {
      throw CodeException.NotFound();
    }

    if (!code.giftId) {
      return {
        value: code.value,
        gift: null,
      };
    }

    const gift = await this.giftRepository.findOne({
      where: { _id: code.giftId, deletedAt: IsNull() } as any,
      select: { name: true, image: true, images: true },
    });
    if (!gift) {
      return {
        value: code.value,
        gift: null,
      };
    }

    return {
      value: code.value,
      gift: gift,
    };
  }

  // G'oliblar - WinnerModel dagi kodlar bilan ishlatilgan kodlar
  async getWinners(query: PagingDto): Promise<any[]> {
    const allWinners = await this.winnerRepository.find({
      where: { deletedAt: IsNull() } as any,
      select: { value: true },
    });
    const winnerValues = allWinners.map(w => w.value);
    
    const winnerValueFilters: string[] = [];
    for (const code of winnerValues) {
      const normalized = norm(code);
      const withHyphen = normalized.length === 10 ? `${normalized.slice(0, 6)}-${normalized.slice(6)}` : normalized;
      winnerValueFilters.push(code, withHyphen, normalized, code.replace(/-/g, ''));
    }

    const where: any = {
      deletedAt: IsNull(),
      isUsed: true,
    };

    if (winnerValueFilters.length > 0) {
      where.value = In(winnerValueFilters);
    } else {
      where.value = null; // Agar g'olib kodlar bo'lmasa
    }

    if (query.search) {
      where.value = Like(`%${query.search}%`);
      if (winnerValueFilters.length > 0) {
        where.value = In(winnerValueFilters.filter(v => v.includes(query.search)));
      }
    }

    const data = await this.repository.find({
      where,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
        value: true,
        isUsed: true,
        usedAt: true,
        usedById: true,
        giftId: true,
        usedBy: {
          _id: true,
          tgId: true,
          tgFirstName: true,
          tgLastName: true,
          firstName: true,
          phoneNumber: true,
      },
        gift: {
          _id: true,
          id: true,
          name: true,
          type: true,
          image: true,
          images: true,
      },
      },
      order: { usedAt: 'DESC' },
    });

    return data as any;
  }

  // Mag'lublar - WinnerModel da yo'q, lekin CodeModel da bor va ishlatilgan kodlar
  async getLosers(query: PagingDto): Promise<any[]> {
    const allWinners = await this.winnerRepository.find({
      where: { deletedAt: IsNull() } as any,
      select: { value: true },
    });
    const winnerValues = allWinners.map(w => w.value);
    
    const winnerValueFilters: string[] = [];
    for (const code of winnerValues) {
      const normalized = norm(code);
      const withHyphen = normalized.length === 10 ? `${normalized.slice(0, 6)}-${normalized.slice(6)}` : normalized;
      winnerValueFilters.push(code, withHyphen, normalized, code.replace(/-/g, ''));
    }

    const where: any = {
      deletedAt: IsNull(),
      isUsed: true,
    };

    if (winnerValueFilters.length > 0) {
      where.value = Not(In(winnerValueFilters));
    }

    if (query.search) {
      where.value = Like(`%${query.search}%`);
      if (winnerValueFilters.length > 0) {
        where.value = Not(In(winnerValueFilters));
      }
    }

    const data = await this.repository.find({
      where,
      relations: ['usedBy'],
      select: {
        _id: true,
        id: true,
        value: true,
        isUsed: true,
        usedAt: true,
        usedById: true,
        usedBy: {
          _id: true,
          tgId: true,
          tgFirstName: true,
          tgLastName: true,
          firstName: true,
          phoneNumber: true,
      },
      },
      order: { usedAt: 'DESC' },
    });

    return data as any;
  }

  // Winner kodlar - WinnerModel dagi kodlar (bazada bor)
  async getWinnerCodes(query: PagingDto): Promise<any[]> {
    const allWinners = await this.winnerRepository.find({
      where: { deletedAt: IsNull() } as any,
      select: { value: true },
    });
    const winnerValues = allWinners.map(w => w.value);
    
    const winnerValueFilters: string[] = [];
    for (const code of winnerValues) {
      const normalized = norm(code);
      const withHyphen = normalized.length === 10 ? `${normalized.slice(0, 6)}-${normalized.slice(6)}` : normalized;
      winnerValueFilters.push(code, withHyphen, normalized, code.replace(/-/g, ''));
    }

    const where: any = {
      deletedAt: IsNull(),
    };

    if (winnerValueFilters.length > 0) {
      where.value = In(winnerValueFilters);
    } else {
      where.value = null;
    }

    if (query.search) {
      where.value = Like(`%${query.search}%`);
      if (winnerValueFilters.length > 0) {
        where.value = In(winnerValueFilters.filter(v => v.includes(query.search)));
      }
    }

    const data = await this.repository.find({
      where,
      relations: ['gift', 'usedBy'],
      select: {
        _id: true,
        id: true,
        value: true,
        isUsed: true,
        usedAt: true,
        usedById: true,
        giftId: true,
        gift: {
          _id: true,
          id: true,
          name: true,
          type: true,
          image: true,
          images: true,
      },
        usedBy: {
          _id: true,
          tgId: true,
          tgFirstName: true,
          tgLastName: true,
          firstName: true,
          phoneNumber: true,
      },
      },
      order: { id: 'ASC' },
    });

    return data as any;
  }

  // Yutuqsiz kodlar - bazada bor, lekin WinnerModel da yo'q kodlar
  async getNonWinnerCodes(query: PagingDto): Promise<any[]> {
    const allWinners = await this.winnerRepository.find({
      where: { deletedAt: IsNull() } as any,
      select: { value: true },
    });
    const winnerValues = allWinners.map(w => w.value);
    
    const winnerValueFilters: string[] = [];
    for (const code of winnerValues) {
      const normalized = norm(code);
      const withHyphen = normalized.length === 10 ? `${normalized.slice(0, 6)}-${normalized.slice(6)}` : normalized;
      winnerValueFilters.push(code, withHyphen, normalized, code.replace(/-/g, ''));
    }

    const where: any = {
      deletedAt: IsNull(),
    };

    if (winnerValueFilters.length > 0) {
      where.value = Not(In(winnerValueFilters));
    }

    if (query.search) {
      where.value = Like(`%${query.search}%`);
      if (winnerValueFilters.length > 0) {
        where.value = Not(In(winnerValueFilters));
      }
    }

    const data = await this.repository.find({
      where,
      relations: ['usedBy'],
      select: {
        _id: true,
        id: true,
        value: true,
        isUsed: true,
        usedAt: true,
        usedById: true,
        giftId: true,
        usedBy: {
          _id: true,
          tgId: true,
          tgFirstName: true,
          tgLastName: true,
          firstName: true,
          phoneNumber: true,
        },
      },
      order: { id: 'ASC' },
    });

    return data as any;
  }

  // Kod kiritib GET qilganda qaysi oyga tegishli ekanligini qaytaradi
  async getCodeMonth(value: string): Promise<{ value: string; month: string | null }> {
    const normalized = norm(value);
    const withHyphen = normalized.length === 10 ? `${normalized.slice(0, 6)}-${normalized.slice(6)}` : normalized;
    
    const code = await this.repository.findOne({
      where: [
        { value: value, deletedAt: IsNull() },
        { value: withHyphen, deletedAt: IsNull() },
        { value: normalized, deletedAt: IsNull() },
        { value: value.replace(/-/g, ''), deletedAt: IsNull() },
      ] as any,
      select: { value: true, month: true },
    });

    if (!code) {
      throw CodeException.NotFound();
    }

    return {
      value: code.value,
      month: code.month || null,
    };
  }

  // Oy tanlansa shu oyga tegishli kodlar chiqadi
  async getCodesByMonth(query: PagingDto, month: string): Promise<any[]> {
    const where: any = {
      deletedAt: IsNull(),
      month: month,
    };

    if (query.search) {
      const searchNum = parseInt(query.search);
      if (!isNaN(searchNum)) {
        where.id = searchNum;
      } else {
        where.value = Like(`%${query.search}%`);
      }
    }

    const data = await this.repository.find({
      where,
      relations: ['usedBy', 'gift'],
      select: {
        _id: true,
        id: true,
        value: true,
        giftId: true,
        isUsed: true,
        usedAt: true,
        usedById: true,
        month: true,
        usedBy: {
          _id: true,
          tgId: true,
          tgFirstName: true,
          tgLastName: true,
          firstName: true,
          phoneNumber: true,
        },
        gift: {
          _id: true,
          id: true,
          name: true,
          image: true,
          images: true,
          totalCount: true,
          usedCount: true,
        },
      },
      order: { usedAt: 'DESC', id: 'ASC' },
    });

    return data as any;
  }
}
