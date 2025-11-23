import { Router } from 'express';
import { userController } from './controller';
import { runAsyncWrapper } from '../../common/utility/run-async-wrapper';
import { UserRole } from '../../db/entities/user.entity';

const requireSuperAdmin = userController.authorizeRoles(UserRole.SUPER_ADMIN);

const usersRouter = Router()
  .post('/', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.create))
  .post('/login', runAsyncWrapper(userController.login))
  .put('/', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.updateById))
  .get('/me', userController.authorizeUser, runAsyncWrapper(userController.getMe))
  .post('/update-token', userController.authorizeUser, runAsyncWrapper(userController.refreshToken))
  .get('/:id', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.getById))
  .get('/', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.getAll))
  .delete('/:id', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.deleteById));

export { usersRouter };
