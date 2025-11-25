import { Router } from 'express';
import { userController } from './controller';
import { runAsyncWrapper } from '../../common/utility/run-async-wrapper';
import { UserRole } from '../../db/entities/user.entity';

const requireSuperAdmin = userController.authorizeRoles(UserRole.SUPER_ADMIN);
const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const usersRouter = Router()
  .post('/', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.create))
  .post('/login', runAsyncWrapper(userController.login))
  .put('/', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.updateById))
  .put('/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(userController.updateAnyUser))
  .get('/me', userController.authorizeUser, requireAdmin, runAsyncWrapper(userController.getMe))
  .post('/update-token', userController.authorizeUser, requireAdmin, runAsyncWrapper(userController.refreshToken))
  .get('/users/all', userController.authorizeUser, requireAdmin, runAsyncWrapper(userController.getAllUsers))
  .get('/admins/all', userController.authorizeUser, requireAdmin, runAsyncWrapper(userController.getAllAdmins))
  .get('/user/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(userController.getUserById))
  .get('/:id', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.getById))
  .get('/', userController.authorizeUser, requireSuperAdmin, runAsyncWrapper(userController.getAll))
  .delete('/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(userController.deleteAnyUser));

export { usersRouter };
