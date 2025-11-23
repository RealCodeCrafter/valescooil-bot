import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { dashboardGiftCodesController } from './controller';

const dashboardGiftCodesRouter = Router().get(
  '/codes',
  runAsyncWrapper(dashboardGiftCodesController.getGiftCodes),
);

export { dashboardGiftCodesRouter };





