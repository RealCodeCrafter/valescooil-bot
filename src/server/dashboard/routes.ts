import { Router } from 'express';
import { analyticsRouter } from './analytics/routes';
import { overviewRouter } from './overview/routes';
import { clientsRouter } from './clients/routes';
import { dashboardGiftCodesRouter } from './gift-codes/routes';
import { dashboardCodesRouter } from './codes/routes';

const dashboardRouter = Router()
  .use('/analytics', analyticsRouter)
  .use('/overview', overviewRouter)
  .use('/clients', clientsRouter)
  .use('/gifts', dashboardGiftCodesRouter)
  .use('/codes', dashboardCodesRouter);

export { dashboardRouter };
