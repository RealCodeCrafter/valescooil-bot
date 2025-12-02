import { Request, Response } from 'express';
import { validateIt } from '../../../common/validation/validate';
import { DashboardCodesDto, DashboardCodesDtoGroup } from './class-validator';
import { DashboardCodesService } from './service';

class DashboardCodesController {
  private readonly dashboardCodesService = new DashboardCodesService();

  constructor() {
    this.getCodes = this.getCodes.bind(this);
    this.search = this.search.bind(this);
  }

  async getCodes(req: Request, res: Response) {
    const query = await validateIt(req.query, DashboardCodesDto, []);
    const result = await this.dashboardCodesService.getCodes(query);

    return res.success(result);
  }

  async search(req: Request, res: Response) {
    const query = await validateIt(req.query, DashboardCodesDto, []);
    
    if (!query.search || !query.search.trim()) {
      return res.success([]);
    }

    // Search kodlar, g'olib kodlar va foydalanuvchilar orasida qidirish
    const result = await this.dashboardCodesService.searchAll(query);

    return res.success(result);
  }
}

export const dashboardCodesController = new DashboardCodesController();


