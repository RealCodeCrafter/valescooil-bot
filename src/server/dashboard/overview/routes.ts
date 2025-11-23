import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { overviewController } from './controller';

const overviewRouter = Router().get('/', runAsyncWrapper(overviewController.getSummary));

export { overviewRouter };





