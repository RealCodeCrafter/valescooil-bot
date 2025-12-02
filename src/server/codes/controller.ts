import { validateIt } from '../../common/validation/validate';
import { Request, Response } from 'express';
import { CodeService } from './service';
import { CodeDto, CodeDtoGroup, CodePagingDto } from './class-validator';
import { PagingDto } from '../../common/validation/dto/paging.dto';

class CodeController {
  private readonly codesService = new CodeService();

  constructor() {
    this.getById = this.getById.bind(this);
    this.getAll = this.getAll.bind(this);
    this.checkCode = this.checkCode.bind(this);
    this.getUsedBy = this.getUsedBy.bind(this);
    this.codeGiftGive = this.codeGiftGive.bind(this);
    this.resetCodeUsage = this.resetCodeUsage.bind(this);
    this.resetCodeUsageByValue = this.resetCodeUsageByValue.bind(this);
    this.resetWinnerCodeUsage = this.resetWinnerCodeUsage.bind(this);
    this.resetWinnerCodeUsageByValue = this.resetWinnerCodeUsageByValue.bind(this);
    this.getWinners = this.getWinners.bind(this);
    this.getWinnerById = this.getWinnerById.bind(this);
    this.getLosers = this.getLosers.bind(this);
    this.getLoserById = this.getLoserById.bind(this);
    this.getWinnerCodes = this.getWinnerCodes.bind(this);
    this.getWinnerCodeById = this.getWinnerCodeById.bind(this);
    this.getNonWinnerCodes = this.getNonWinnerCodes.bind(this);
    this.getNonWinnerCodeById = this.getNonWinnerCodeById.bind(this);
    this.getCodeMonth = this.getCodeMonth.bind(this);
    this.getCodesByMonth = this.getCodesByMonth.bind(this);
  }

  public async getById(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);

    const result = await this.codesService.findById(data._id, { month: false } as any);
    if (result) {
      const { month, ...rest } = result as any;
      return res.success(rest);
    }
    return res.success(null);
  }

  public async codeGiftGive(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);

    const result = await this.codesService.codeGiftGive(data._id, req.user._id);
    return res.success(result);
  }

  public async resetCodeUsage(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);

    const result = await this.codesService.resetCodeUsage(data._id);
    return res.success(result);
  }

  public async resetWinnerCodeUsage(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);

    const result = await this.codesService.resetWinnerCodeUsage(data._id);
    return res.success(result);
  }

  public async resetCodeUsageByValue(req: Request, res: Response) {
    const data = await validateIt(req.query, CodeDto, [CodeDtoGroup.CHECK_CODE]);

    const result = await this.codesService.resetCodeUsageByValue(data.value);
    return res.success(result);
  }

  public async resetWinnerCodeUsageByValue(req: Request, res: Response) {
    const data = await validateIt(req.query, CodeDto, [CodeDtoGroup.CHECK_CODE]);

    const result = await this.codesService.resetWinnerCodeUsageByValue(data.value);
    return res.success(result);
  }

  public async getAll(req: Request, res: Response) {
    const query = await validateIt(req.query, CodePagingDto, []);
    const codes = await this.codesService.getAll(query);

    return res.success(codes);
  }

  public async getUsedBy(req: Request, res: Response) {
    const param = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_USED_BY_USER_ID]);
    const query = await validateIt(req.query, PagingDto, []);

    const codes = await this.codesService.getUsedByUser(query, param.usedById);

    return res.success(codes);
  }

  public async checkCode(req: Request, res: Response) {
    const data = await validateIt(req.body, CodeDto, [CodeDtoGroup.CHECK_CODE]);

    const result = await this.codesService.checkCode(data.value);
    return res.success(result);
  }

  // G'oliblar - winners.json dagi kodlar bilan ishlatilgan kodlar
  public async getWinners(req: Request, res: Response) {
    const query = await validateIt(req.query, PagingDto, []);
    const result = await this.codesService.getWinners(query);

    return res.success(result);
  }

  public async getWinnerById(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);
    const result = await this.codesService.findById(data._id, { month: false } as any);
    if (result) {
      const { month, ...rest } = result as any;
      return res.success(rest);
    }
    return res.success(null);
  }

  // Mag'lublar - winners.json da yo'q, lekin bazada bor va ishlatilgan kodlar
  public async getLosers(req: Request, res: Response) {
    const query = await validateIt(req.query, PagingDto, []);
    const result = await this.codesService.getLosers(query);

    return res.success(result);
  }

  public async getLoserById(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);
    const result = await this.codesService.findById(data._id, { month: false } as any);
    if (result) {
      const { month, ...rest } = result as any;
      return res.success(rest);
    }
    return res.success(null);
  }

  // Winner kodlar - winners.json dagi kodlar
  public async getWinnerCodes(req: Request, res: Response) {
    const query = await validateIt(req.query, PagingDto, []);
    const result = await this.codesService.getWinnerCodes(query);

    return res.success(result);
  }

  public async getWinnerCodeById(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);
    const result = await this.codesService.findById(data._id, { month: false } as any);
    if (result) {
      const { month, ...rest } = result as any;
      return res.success(rest);
    }
    return res.success(null);
  }

  // Yutuqsiz kodlar - bazada bor, lekin winners.json da yo'q kodlar
  public async getNonWinnerCodes(req: Request, res: Response) {
    const query = await validateIt(req.query, PagingDto, []);
    const result = await this.codesService.getNonWinnerCodes(query);

    return res.success(result);
  }

  public async getNonWinnerCodeById(req: Request, res: Response) {
    const data = await validateIt(req.params, CodeDto, [CodeDtoGroup.GET_BY_ID]);
    const result = await this.codesService.findById(data._id, { month: false } as any);
    if (result) {
      const { month, ...rest } = result as any;
      return res.success(rest);
    }
    return res.success(null);
  }

  // Kod kiritib GET qilganda qaysi oyga tegishli ekanligini qaytaradi
  public async getCodeMonth(req: Request, res: Response) {
    const data = await validateIt(req.query, CodeDto, [CodeDtoGroup.CHECK_CODE]);
    const result = await this.codesService.getCodeMonth(data.value);
    return res.success(result);
  }

  // Oy tanlansa shu oyga tegishli kodlar chiqadi
  public async getCodesByMonth(req: Request, res: Response) {
    const month = req.params.month;
    if (!month) {
  return res.status(400).json({
    success: false,
    message: 'Month parameter is required'
  });
}
    const query = await validateIt(req.query, CodePagingDto, []);
    const codes = await this.codesService.getCodesByMonth(query, month);

    return res.success(codes);
  }
}

export const codesController = new CodeController();
