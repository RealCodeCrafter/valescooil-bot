import { PagingDto } from '../../common/validation/dto/paging.dto';
import { Gift } from '../../db/entities/gift.entity';
import { BaseService } from '../base.service';
import { GiftDto } from './class-validator';
import { AppDataSource } from '../../db/connect.db';
import { IsNull, Like } from 'typeorm';

export class GiftService extends BaseService<Gift, GiftDto> {
  constructor() {
    super(AppDataSource.getRepository(Gift));
  }

  async getPaging(query: PagingDto): Promise<{ data: GiftDto[]; total: number }> {
    const where: any = { deletedAt: IsNull() };
    
    if (query.search) {
      const searchNum = parseInt(query.search);
      if (!isNaN(searchNum)) {
        where.id = searchNum;
      } else {
        where.name = Like(`%${query.search}%`);
      }
    }
const result = await this.findPaging(
  where,
  { _id: 'DESC' } as any,
  query.limit ?? 10,
  query.page ?? 1,
  {
    _id: true,
    id: true,
    name: true,
    image: true,
    images: true,
    totalCount: true,
    usedCount: true,
  },
);

return {
data: result.data.map(item => Object.assign(new GiftDto(), item)),
  total: result.total,
};
  }
}
