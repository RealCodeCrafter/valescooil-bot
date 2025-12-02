import { validateIt } from '../../common/validation/validate';
import { isUUID } from 'class-validator';
import { UserDto, UserDtoGroup, GetUsersRequestDto, UserLoginRequestDto } from './class-validator';
import { NextFunction, Request, Response } from 'express';
import { UserService } from './service';
import { CommonDtoGroup } from '../../common/validation/dto/common.dto';
import { UserException } from './error';
import { StatusCodes } from '../../common/utility/status-codes';
import { Gender, UserRole } from '../../db/entities/user.entity';

class UserController {
  private readonly userService = new UserService();

  constructor() {
    this.create = this.create.bind(this);
    this.updateById = this.updateById.bind(this);
    this.updateAnyUser = this.updateAnyUser.bind(this);
    this.getById = this.getById.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.getMe = this.getMe.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getAllAdmins = this.getAllAdmins.bind(this);
    this.deleteById = this.deleteById.bind(this);
    this.deleteAnyUser = this.deleteAnyUser.bind(this);
    this.login = this.login.bind(this);
    this.authorizeUser = this.authorizeUser.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
  }

  // 🧩 Foydalanuvchi yaratish (POST /users)
  async create(req: Request, res: Response) {
    const body = await validateIt(req.body, UserDto, [UserDtoGroup.CREATE]);
    // Role request'dan keladi, agar yo'q bo'lsa default ADMIN
    // SuperAdmin ADMIN yoki SUPER_ADMIN yaratishi mumkin
    if (!body.role) {
      body.role = UserRole.ADMIN;
    }

    // 👉 Asl metod: createUser
    const user = await this.userService.createUser(body);
    return res.success(user, {}, StatusCodes.CREATED);
  }

  async updateById(req: Request, res: Response) {
    const body = await validateIt(req.body, UserDto, [UserDtoGroup.UPDATE]);
    const tgId = body.tgId;
    
    if (!tgId) {
      return res.status(400).send({ message: 'tgId is required' });
    }

    body.role = undefined;

    if (body.password) {
      if (body.password !== body.confirmPassword) {
        throw UserException.InvalidPassword();
      }

      body.password = await this.userService.hashPassword(body.password);
    }

    const user = await this.userService.findByIdAndUpdateUser(tgId, body);
    return res.success(user);
  }

  public async getById(req: Request, res: Response) {
    const tgId = req.params.id;

    if (!tgId || isNaN(Number(tgId))) {
      return res.status(400).send({ message: 'Invalid tgId' });
    }

    const user = await this.userService.getAdminByTgId(Number(tgId));

    if (!user) {
      throw UserException.NotFound();
    }

    return res.success(user);
  }

  public async getMe(req: Request, res: Response) {
    const id = req.user?._id;

    if (!id || !isUUID(id)) {
      return res.status(400).send({ message: 'Invalid user id' });
    }

    const user = await this.userService.getMe(id);

    const fullNameParts = [
      user.firstName || user.tgFirstName || '',
      user.lastName || user.tgLastName || '',
    ].filter(Boolean);

    const profile = {
      fullName: fullNameParts.join(' ') || user.username || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      dateOfBirth: user.birthday || null,
      gender: user.gender || Gender.NotSet,
      registeredDate: user.createdAt || null,
    };

    return res.success(profile);
  }

  public async getAll(req: Request, res: Response) {
    const query = await validateIt(req.query, GetUsersRequestDto, []);

    const data = await this.userService.getAll(query);

    return res.success(data);
  }

  // 🆕 Userlarni hammasini olish (USER role)
  public async getAllUsers(req: Request, res: Response) {
    const query = await validateIt(req.query, GetUsersRequestDto, []);

    const data = await this.userService.getAllUsers(query);

    return res.success(data);
  }

  // 🆕 Adminlarni hammasini olish (ADMIN va SUPER_ADMIN)
  public async getAllAdmins(req: Request, res: Response) {
    const query = await validateIt(req.query, GetUsersRequestDto, []);

    const data = await this.userService.getAllAdmins(query);

    return res.success(data);
  }

  // 🆕 Har qanday user'ni tgId orqali olish
  public async getUserById(req: Request, res: Response) {
    const tgId = req.params.id;

    if (!tgId || isNaN(Number(tgId))) {
      return res.status(400).send({ message: 'Invalid tgId' });
    }

    const user = await this.userService.getUserById(Number(tgId));

    if (!user) {
      throw UserException.NotFound();
    }

    return res.success(user);
  }

  public async deleteById(req: Request, res: Response) {
    const tgId = req.params.id;

    if (!tgId || isNaN(Number(tgId))) {
      return res.status(400).json({ error: 'invalid tgId' });
    }

    const tgIdNumber = Number(tgId);
    
    // Foydalanuvchi o'zini o'chirishni tekshirish - current user'ning tgId'ini topish
    const currentUser = await this.userService.findById(req.user?._id);
    const currentUserTgId = currentUser ? (currentUser as any).tgId : null;

    // deleteAnyUser metodidan foydalanish (hard delete)
    await this.userService.deleteAnyUser(tgIdNumber, currentUserTgId);

    return res.success({ tgId: tgId });
  }

  // 🆕 Umumiy user update qilish (USER, ADMIN uchun)
  public async updateAnyUser(req: Request, res: Response) {
    const body = await validateIt(req.body, UserDto, [UserDtoGroup.UPDATE]);
    const tgId = req.params.id;
    
    if (!tgId || isNaN(Number(tgId))) {
      return res.status(400).send({ message: 'Invalid tgId' });
    }

    // Role o'zgartirish faqat SUPER_ADMIN uchun
    const allowRoleChange = req.user?.role === UserRole.SUPER_ADMIN;
    body.role = allowRoleChange ? body.role : undefined;

    const user = await this.userService.updateAnyUser(Number(tgId), body, allowRoleChange);
    return res.success(user);
  }

  // 🆕 Umumiy user delete qilish (USER, ADMIN uchun)
  public async deleteAnyUser(req: Request, res: Response) {
    const tgId = req.params.id;

    if (!tgId || isNaN(Number(tgId))) {
      return res.status(400).json({ error: 'invalid tgId' });
    }

    if (!req.user?._id) {
      return res.status(401).json(UserException.Unauthorized());
    }

    const tgIdNumber = Number(tgId);
    
    // Current user'ning tgId'ini topish
    try {
      const currentUser = await this.userService.findById(req.user._id);
      const currentUserTgId = currentUser ? (currentUser as any).tgId : null;

      await this.userService.deleteAnyUser(tgIdNumber, currentUserTgId);

      return res.success({ tgId: tgId });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json(error);
      }
      throw error;
    }
  }

  //! 🧩 Auth
  public async login(req: Request, res: Response) {
    const body = await validateIt(req.body, UserLoginRequestDto, [CommonDtoGroup.CREATE]);
    const data = await this.userService.login(body);
    return res.success(data, {});
  }

  async authorizeUser(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json(UserException.Unauthorized());
      }

      req.user = await this.userService.authorizeUser(token, 'access');
      next();
    } catch (err) {
      return res.status(401).json(UserException.Unauthorized());
    }
  }

  async refreshToken(req: Request, res: Response) {
    const body = await validateIt(req.body, UserLoginRequestDto, [CommonDtoGroup.UPDATE]);
    const data = await this.userService.refreshToken(body.refreshToken);
    return res.success(data, {});
  }

  authorizeRoles(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role as UserRole)) {
        return res.status(StatusCodes.FORBIDDEN).json(UserException.NotEnoughPermission(StatusCodes.FORBIDDEN));
      }

      next();
    };
  }
}

export const userController = new UserController();
