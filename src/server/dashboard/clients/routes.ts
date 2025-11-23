import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { dashboardClientController } from './controller';

const clientsRouter = Router().get('/', runAsyncWrapper(dashboardClientController.getClients));

export { clientsRouter };





