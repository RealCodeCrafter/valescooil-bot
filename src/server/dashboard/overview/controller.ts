import { Request, Response } from 'express';
import { OverviewService } from './service';

class OverviewController {
  private readonly overviewService = new OverviewService();

  constructor() {
    this.getSummary = this.getSummary.bind(this);
  }

  async getSummary(_req: Request, res: Response) {
    const data = await this.overviewService.getSummary();
    return res.success(data);
  }
}

export const overviewController = new OverviewController();





