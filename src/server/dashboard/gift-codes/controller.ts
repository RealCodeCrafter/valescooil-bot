import { Request, Response } from 'express';
import { validateIt } from '../../../common/validation/validate';
import { DashboardCodesService } from '../codes/service';
import { DashboardGiftCodesDto, DashboardGiftCodesDtoGroup } from './class-validator';

class DashboardGiftCodesController {
  private readonly dashboardCodesService = new DashboardCodesService();

  constructor() {
    this.getGiftCodes = this.getGiftCodes.bind(this);
  }

  async getGiftCodes(req: Request, res: Response) {
    const query = await validateIt(req.query, DashboardGiftCodesDto, []);
    const result = await this.dashboardCodesService.getGiftCodes(query);

    return res.success(result);
  }
}

export const dashboardGiftCodesController = new DashboardGiftCodesController();





