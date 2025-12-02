import { Request, Response } from 'express';
import { DashboardClientService } from './service';
import { DashboardClientPagingDto, DashboardClientDtoGroup } from './class-validator';
import { validateIt } from '../../../common/validation/validate';

class DashboardClientController {
  private readonly dashboardClientService = new DashboardClientService();

  constructor() {
    this.getClients = this.getClients.bind(this);
  }

  async getClients(req: Request, res: Response) {
    const query = await validateIt(req.query, DashboardClientPagingDto, []);
    const result = await this.dashboardClientService.getClients(query);

    return res.success(result);
  }
}

export const dashboardClientController = new DashboardClientController();





