import { Response, Router } from 'express';
import { runAsyncWrapper } from '../common/utility/run-async-wrapper';
import { giftsRouter } from './gifts/routes';
import { CommonException } from '../common/errors/common.error';
import { usersRouter } from './users/routes';
import { userController } from './users/controller';
import { filesRouter } from './file/routes';
import { codesRouter } from './codes/routes';
import { codesController } from './codes/controller';
import { dashboardRouter } from './dashboard/routes';
import { UserRole } from '../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const router = Router()
  .get(
    '/check-health',
    runAsyncWrapper((_req: Request, res: Response) => {
      res.success({ message: "I'm OK. THANKS" });
    }),
  )
  .use('/dashboard', userController.authorizeUser, requireAdmin, dashboardRouter)
  .use('/files', userController.authorizeUser, requireAdmin, filesRouter)
  .use('/users', usersRouter)
  .use('/gifts', userController.authorizeUser, requireAdmin, giftsRouter)
  .use('/codes', userController.authorizeUser, requireAdmin, codesRouter)
  .post('/check-code', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.checkCode));

// // 404 Error
router.all('*', (_req, _res, _next) => {
  throw CommonException.NotFound();
});

export { router };
