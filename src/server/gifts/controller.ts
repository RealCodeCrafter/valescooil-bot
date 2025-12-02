import { validateIt } from '../../common/validation/validate';
import { Request, Response } from 'express';
import { GiftService } from './service';
import { GiftDto, GiftDtoGroup } from './class-validator';
import { StatusCodes } from '../../common/utility/status-codes';
import { PagingDto } from '../../common/validation/dto/paging.dto';
import { Gift } from '../../db/entities/gift.entity';

class GiftController {
  private readonly giftService = new GiftService();

  constructor() {
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.updateById = this.updateById.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.deleteById = this.deleteById.bind(this);
  }

  public async create(req: Request, res: Response) {
    const body = await validateIt(req.body, GiftDto, [GiftDtoGroup.CREATE]);

    const result = await this.giftService.create(body);

    return res.success(result, {}, StatusCodes.CREATED);
  }

  public async updateById(req: Request, res: Response) {
   const body = await validateIt(req.body, GiftDto, [GiftDtoGroup.UPDATE]);

const updateData: Partial<Gift> = {
  name: body.name,
  image: body.image,
  images: body.images,
  totalCount: body.totalCount,
  usedCount: body.usedCount,
  deletedAt: body.deletedAt ? new Date(body.deletedAt) : null,
};

const gift = await this.giftService.findByIdAndUpdate(body._id, updateData, {
  relations: [],
});

return res.success(gift);

  }

  public async getById(req: Request, res: Response) {
    const data = await validateIt(req.params, GiftDto, [GiftDtoGroup.GET_BY_ID]);

    const result = await this.giftService.findById(data._id);
    return res.success(result);
  }

  public async getAll(req: Request, res: Response) {
    const query = await validateIt(req.query, PagingDto, []);
    const gifts = await this.giftService.getAll(query);

    return res.success(gifts);
  }

  public async deleteById(req: Request, res: Response) {
    const data = await validateIt(req.params, GiftDto, [GiftDtoGroup.DELETE]);

    await this.giftService.deleteById(data._id, req.user._id);

    return res.success({ _id: data._id });
  }
}

export const giftController = new GiftController();
