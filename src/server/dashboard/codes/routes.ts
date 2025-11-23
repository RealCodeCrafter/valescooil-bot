import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { dashboardCodesController } from './controller';

const dashboardCodesRouter = Router()
  .get('/', runAsyncWrapper(dashboardCodesController.getCodes))
  .get('/search', runAsyncWrapper(dashboardCodesController.search));

export { dashboardCodesRouter };


