import { Repository, FindOptionsWhere, FindOptionsSelect, FindOptionsOrder, DataSource } from 'typeorm';
import { PagingDto } from '../common/validation/dto/paging.dto';
import { BaseEntity } from './base.entity';
import { CommonException } from '../common/errors/common.error';
import { QuerySort } from '../common/validation/types';
import { AppDataSource } from '../db/connect.db';

export class BaseService<Entity extends BaseEntity, Dto = any> {
  constructor(protected readonly repository: Repository<Entity>) {}

  toObjectId(id: string, is_throw = true): string {
    if (!id) {
      if (is_throw) throw new Error('ID is required');
      return '';
    }
    return id;
  }

  async sendError(_on: string, _message: any) {
  // Error logged
}


  async create(doc: Partial<Dto> | Partial<Dto>[]): Promise<Entity | Entity[]> {
  try {
    const entity = this.repository.create(doc as any);
    return await this.repository.save(entity);
  } catch (e: any) {
    this.sendError('BaseService.create', e?.message);
    throw CommonException.InternalServerError();
  }
}

  async insertMany(docs: Partial<Entity>[]): Promise<Entity[]> {
    try {
      const entities = this.repository.create(docs as any);
      return await this.repository.save(entities);
    } catch (e: any) {
      this.sendError('BaseService.insertMany', e?.message);
      throw CommonException.InternalServerError();
    }
  }

  async countAsync(filter: FindOptionsWhere<Entity>): Promise<number> {
    try {
      return await this.repository.count({ where: filter });
    } catch (e: any) {
      this.sendError('BaseService.countAsync', e?.message);
      return 0;
    }
  }

  async findById(
    id: string,
    select?: FindOptionsSelect<Entity>,
    options?: { relations?: string[] },
  ): Promise<Entity | null> {
    try {
      return await this.repository.findOne({
        where: { _id: id } as any,
        select,
        relations: options?.relations,
      });
    } catch (e: any) {
      this.sendError('BaseService.findById', e?.message);
      return null;
    }
  }

  async findOne(
    filter: FindOptionsWhere<Entity>,
    select?: FindOptionsSelect<Entity>,
    relations?: string[],
  ): Promise<Entity | null> {
    try {
      return await this.repository.findOne({
        where: filter,
        select,
        relations,
      });
    } catch (e: any) {
      this.sendError('BaseService.findOne', e?.message);
      return null;
    }
  }

  async findByIdAndUpdate(
    id: string,
    data: Partial<Entity>,
    options?: { relations?: string[] },
  ): Promise<Entity | null> {
    try {
      await this.repository.update(id, data as any);
      return await this.findById(id, undefined, options);
    } catch (e: any) {
      this.sendError('BaseService.findByIdAndUpdate', e?.message);
      return null;
    }
  }

  async findOneAndUpdate(
    query: FindOptionsWhere<Entity>,
    data: Partial<Entity>,
  ): Promise<Entity | null> {
    try {
      const entity = await this.findOne(query);
      if (!entity) return null;
      Object.assign(entity, data);
      return await this.repository.save(entity);
    } catch (e: any) {
      this.sendError('BaseService.findOneAndUpdate', e?.message);
      return null;
    }
  }

  protected async findPaging(
    filter: FindOptionsWhere<Entity>,
    sort: QuerySort<Dto>,
    limit = 10,
    page = 1,
    select?: FindOptionsSelect<Entity>,
    relations?: string[],
  ): Promise<{ data: Entity[]; total: number }> {
    try {
      const order = sort as FindOptionsOrder<Entity>;
      const [data, total] = await this.repository.findAndCount({
        where: filter,
        select,
        relations,
        order,
        take: limit,
        skip: (page - 1) * limit,
      });

      return { data, total };
    } catch (e: any) {
      this.sendError('BaseService.findPaging', e?.message);
      return { data: [], total: 0 };
    }
  }

  async deleteById(id: string, deleteById: string): Promise<string> {
    try {
      await this.repository.update(
        { _id: id, deletedAt: null } as any,
        { deletedAt: new Date(), deletedBy: deleteById } as any,
      );
      return id;
    } catch (e: any) {
      this.sendError('BaseService.deleteById', e?.message);
      throw CommonException.InternalServerError();
    }
  }
}
