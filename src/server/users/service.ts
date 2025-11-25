import { QuerySort } from '../../common/validation/types';
import { User, UserRole } from '../../db/entities/user.entity';
import { UserAuthService } from './auth.service';
import { GetUsersRequestDto, UserDto } from './class-validator';
import { UserException } from './error';
import { AppDataSource } from '../../db/connect.db';
import { DeepPartial, IsNull, Like, In } from 'typeorm';
import { Code } from '../../db/entities/code.entity';
import { Gift } from '../../db/entities/gift.entity';
import { StatusCodes } from '../../common/utility/status-codes';

export class UserService extends UserAuthService<UserDto> {
  constructor() {
    super(AppDataSource.getRepository(User));
  }

  // 🆕 Yangi foydalanuvchi yaratish funksiyasi
  async createUser(data: UserDto): Promise<UserDto> {
    // 1️⃣ — Username yoki Telegram ID mavjud emasligini tekshirish
    const existingUser = await this.repository.findOne({
      where: [
        { username: data.username, deletedAt: IsNull() },
        { tgId: data.tgId, deletedAt: IsNull() },
      ] as any,
    });

    if (existingUser) {
      throw UserException.AllreadyExist('username or tgId');
    }

    // 2️⃣ — Parol va confirmPassword mosligini tekshirish
    if (data.password !== data.confirmPassword) {
      throw UserException.PasswordsDoNotMatch();
    }

    // 3️⃣ — Parolni bcrypt yordamida shifrlash
    const hashedPassword = await this.hashPassword(data.password);

    // 4️⃣ — Foydalanuvchini bazaga saqlash
    const user = this.repository.create({
     tgId: Number(data.tgId),
      tgFirstName: data.tgFirstName,
      tgLastName: data.tgLastName,
      tgUsername: data.tgUsername,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      gender: data.gender ?? 'NOT_SET',
      lang: data.lang ?? 'uz',
      status: data.status ?? 'active',
      role: data.role || UserRole.ADMIN,
      birthday: data.birthday ?? null,
      email: data.email ?? '',
      address: data.address ?? '',
      phoneNumber: data.phoneNumber ?? '',
    } as DeepPartial<User>);
    const savedUser = await this.repository.save(user);

    // 5️⃣ — Access va Refresh token yaratish
    const jwtPayload = { _id: savedUser._id.toString(), role: savedUser.role };
    const tokens = {
      accessToken: await this['signAsync'](jwtPayload, 'access'),
      refreshToken: await this['signAsync'](jwtPayload, 'refresh'),
    };

    return {
      ...savedUser,
      ...tokens,
    } as unknown as UserDto;
  }

  async findByIdAndUpdateUser(tgId: number | string, data: UserDto): Promise<UserDto | null> {
    const tgIdNumber = typeof tgId === 'string' ? Number(tgId) : tgId;
    
    const user = await this.repository.findOne({
      where: { tgId: tgIdNumber, deletedAt: IsNull() } as any,
      select: { _id: true, username: true, role: true, tgId: true },
    });
    
    if (!user || user.role !== UserRole.ADMIN) {
      throw UserException.NotFound();
    }

    if (data.username && user.tgId !== tgIdNumber) {
      const userByUsername = await this.repository.findOne({
        where: { username: data.username, deletedAt: IsNull() } as any,
        select: { _id: true },
      });

      if (userByUsername) {
        throw UserException.AllreadyExist('username');
      }
    }

    // Update data - faqat berilgan maydonlarni olish (undefined emas bo'lganlar)
    const updateData: Partial<User> = {};
    
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.birthday !== undefined) updateData.birthday = data.birthday ?? null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lang !== undefined) updateData.lang = data.lang;
    if (data.tgFirstName !== undefined) updateData.tgFirstName = data.tgFirstName;
    if (data.tgLastName !== undefined) updateData.tgLastName = data.tgLastName;
    if (data.tgUsername !== undefined) updateData.tgUsername = data.tgUsername;

    // Parol yangilangan bo'lsa, shifrlash
    if (data.password) {
      if (data.password !== data.confirmPassword) {
        throw UserException.PasswordsDoNotMatch();
      }
      updateData.password = await this.hashPassword(data.password);
    }

    // Hech qanday o'zgarish bo'lmasa
    if (Object.keys(updateData).length === 0) {
      const existingUser = await this.findById(user._id);
      if (!existingUser) {
        throw UserException.NotFound();
      }
      const { password, ...userWithoutPassword } = existingUser as any;
      return { ...userWithoutPassword, _id: existingUser._id.toString(), id: existingUser._id.toString() } as any;
    }

    const newUser = await this.findByIdAndUpdate(user._id, updateData);

    if (!newUser || !('_id' in newUser)) {
      throw UserException.NotFound();
    }

    // Password ni qaytarmaslik
    const { password, ...userWithoutPassword } = newUser as any;
    return { ...userWithoutPassword, _id: newUser._id.toString(), id: newUser._id.toString() } as any;
  }

  // 🆕 Umumiy user update qilish (USER, ADMIN, SUPER_ADMIN) - tgId bilan
  async updateAnyUser(tgId: number | string, data: UserDto, allowRoleChange: boolean = false): Promise<UserDto | null> {
    const tgIdNumber = typeof tgId === 'string' ? Number(tgId) : tgId;
    
    const user = await this.repository.findOne({
      where: { tgId: tgIdNumber, deletedAt: IsNull() } as any,
      select: { _id: true, username: true, role: true, tgId: true },
    });

    if (!user) {
      throw UserException.NotFound();
    }

    // Username takrorlanmasligini tekshirish
    if (data.username && user.tgId !== tgIdNumber) {
      const userByUsername = await this.repository.findOne({
        where: { username: data.username, deletedAt: IsNull() } as any,
        select: { _id: true },
      });

      if (userByUsername) {
        throw UserException.AllreadyExist('username');
      }
    }

    // Update data - faqat berilgan maydonlarni olish (undefined emas bo'lganlar)
    const updateData: Partial<User> = {};
    
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.birthday !== undefined) updateData.birthday = data.birthday ?? null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lang !== undefined) updateData.lang = data.lang;
    if (data.tgFirstName !== undefined) updateData.tgFirstName = data.tgFirstName;
    if (data.tgLastName !== undefined) updateData.tgLastName = data.tgLastName;
    if (data.tgUsername !== undefined) updateData.tgUsername = data.tgUsername;

    // Role o'zgartirish faqat ruxsat berilganda
    if (allowRoleChange && data.role !== undefined) {
      updateData.role = data.role;
    }

    // Parol yangilangan bo'lsa, shifrlash
    if (data.password) {
      if (data.password !== data.confirmPassword) {
        throw UserException.PasswordsDoNotMatch();
      }
      updateData.password = await this.hashPassword(data.password);
    }

    // Hech qanday o'zgarish bo'lmasa
    if (Object.keys(updateData).length === 0) {
      const existingUser = await this.findById(user._id);
      if (!existingUser) {
        throw UserException.NotFound();
      }
      const { password, ...userWithoutPassword } = existingUser as any;
      return { ...userWithoutPassword, _id: existingUser._id.toString(), id: existingUser._id.toString() } as any;
    }

    const updatedUser = await this.findByIdAndUpdate(user._id, updateData);

    if (!updatedUser || !('_id' in updatedUser)) {
      throw UserException.NotFound();
    }

    // Password ni qaytarmaslik
    const { password, ...userWithoutPassword } = updatedUser as any;
    return { ...userWithoutPassword, _id: updatedUser._id.toString(), id: updatedUser._id.toString() } as any;
  }

  // 🆕 Umumiy user delete qilish (USER, ADMIN, SUPER_ADMIN) - tgId bilan
  async deleteAnyUser(tgId: number | string, deletedByTgId: number | string | null): Promise<string> {
    const tgIdNumber = typeof tgId === 'string' ? Number(tgId) : tgId;
    
    const user = await this.repository.findOne({
      where: { tgId: tgIdNumber, deletedAt: IsNull() } as any,
      select: { _id: true, role: true, tgId: true },
    });

    if (!user) {
      throw UserException.NotFound();
    }

    // SUPER_ADMIN ni o'chirishni taqiqlash
    if (user.role === UserRole.SUPER_ADMIN) {
      throw UserException.NotEnoughPermission('Cannot delete SUPER_ADMIN');
    }

    // deletedBy ni UUID orqali topish
    let deletedByUuid: string | null = null;
    
    if (deletedByTgId !== null && deletedByTgId !== undefined) {
      const deletedByTgIdNumber = typeof deletedByTgId === 'string' ? Number(deletedByTgId) : deletedByTgId;
      
      // O'zini o'chirishni taqiqlash
      if (user.tgId === deletedByTgIdNumber) {
        throw UserException.CannotDeleteYourSelf(StatusCodes.FORBIDDEN);
      }

      const deletedByUser = await this.repository.findOne({
        where: { tgId: deletedByTgIdNumber, deletedAt: IsNull() } as any,
        select: { _id: true },
      });

      if (!deletedByUser) {
        throw UserException.NotFound();
      }

      deletedByUuid = deletedByUser._id;
    }

    return await this.deleteById(user._id, deletedByUuid || user._id);
  }

  async getPaging(query: GetUsersRequestDto): Promise<{ data: UserDto[]; total: number }> {
    const where: any = { deletedAt: IsNull(), role: UserRole.ADMIN };
    
   
if (query.search) {
  where['OR'] = [
    { tgFirstName: Like(`%${query.search}%`) },
    { tgLastName: Like(`%${query.search}%`) },
    { tgUsername: Like(`%${query.search}%`) },
    { username: Like(`%${query.search}%`) },
    { firstName: Like(`%${query.search}%`) },
    { lastName: Like(`%${query.search}%`) },
    { phoneNumber: Like(`%${query.search}%`) },
  ];
}
    const orderType = query.orderType === 'ASC' ? 'ASC' : 'DESC';
    const orderBy = query.orderBy || '_id';
    const order: any = { [orderBy]: orderType };

    const [users, total] = await this.repository.findAndCount({
      where,
      select: {
        _id: true,
        firstName: true,
        lastName: true,
        tgFirstName: true,
        tgLastName: true,
        tgUsername: true,
        tgId: true,
        username: true,
        phoneNumber: true,
        createdAt: true,
      },
      order,
      take: query.limit ?? 10,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
    });

    // Codes bilan join qilish
    const codeRepository = AppDataSource.getRepository(Code);
    const giftRepository = AppDataSource.getRepository(Gift);
    
    const usersWithCodes = await Promise.all(
      users.map(async (user) => {
        const codes = await codeRepository.find({
          where: { usedById: user._id, deletedAt: IsNull() } as any,
          relations: ['gift'],
          select: {
            _id: true,
            id: true,
            value: true,
            giftId: true,
            isUsed: true,
            usedById: true,
            usedAt: true,
            gift: {
              _id: true,
              id: true,
              name: true,
              image: true,
              type: true,
            },
          },
        });

        return {
          ...user,
          codes: codes.map(c => ({
            id: c.id,
            value: c.value,
            giftId: c.giftId,
            isUsed: c.isUsed,
            usedById: c.usedById,
            usedAt: c.usedAt,
            gift: c.gift,
          })),
        };
      })
    );

    return {
      data: usersWithCodes as any,
      total,
    };
  }

  // 🆕 Userlarni hammasini olish (USER role)
  async getAllUsers(query: GetUsersRequestDto): Promise<{ data: UserDto[]; total: number }> {
    const where: any = { deletedAt: IsNull(), role: UserRole.USER };
    
    if (query.search) {
      where['OR'] = [
        { tgFirstName: Like(`%${query.search}%`) },
        { tgLastName: Like(`%${query.search}%`) },
        { tgUsername: Like(`%${query.search}%`) },
        { username: Like(`%${query.search}%`) },
        { firstName: Like(`%${query.search}%`) },
        { lastName: Like(`%${query.search}%`) },
        { phoneNumber: Like(`%${query.search}%`) },
      ];
    }

    const orderType = query.orderType === 'ASC' ? 'ASC' : 'DESC';
    const orderBy = query.orderBy || '_id';
    const order: any = { [orderBy]: orderType };

    const [users, total] = await this.repository.findAndCount({
      where,
      select: {
        _id: true,
        firstName: true,
        lastName: true,
        tgFirstName: true,
        tgLastName: true,
        tgUsername: true,
        tgId: true,
        username: true,
        phoneNumber: true,
        email: true,
        address: true,
        birthday: true,
        gender: true,
        status: true,
        role: true,
        createdAt: true,
        lastUseAt: true,
      },
      order,
      take: query.limit ?? 10,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
    });

    // Password ni olib tashlash
    const usersWithoutPassword = users.map((user: any) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      data: usersWithoutPassword as any,
      total,
    };
  }

  // 🆕 Adminlarni hammasini olish (ADMIN va SUPER_ADMIN)
  async getAllAdmins(query: GetUsersRequestDto): Promise<{ data: UserDto[]; total: number }> {
    const where: any = { 
      deletedAt: IsNull(), 
      role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN])
    };
    
    if (query.search) {
      where['OR'] = [
        { tgFirstName: Like(`%${query.search}%`) },
        { tgLastName: Like(`%${query.search}%`) },
        { tgUsername: Like(`%${query.search}%`) },
        { username: Like(`%${query.search}%`) },
        { firstName: Like(`%${query.search}%`) },
        { lastName: Like(`%${query.search}%`) },
        { phoneNumber: Like(`%${query.search}%`) },
      ];
    }

    const orderType = query.orderType === 'ASC' ? 'ASC' : 'DESC';
    const orderBy = query.orderBy || '_id';
    const order: any = { [orderBy]: orderType };

    const [users, total] = await this.repository.findAndCount({
      where,
      select: {
        _id: true,
        firstName: true,
        lastName: true,
        tgFirstName: true,
        tgLastName: true,
        tgUsername: true,
        tgId: true,
        username: true,
        phoneNumber: true,
        email: true,
        address: true,
        birthday: true,
        gender: true,
        status: true,
        role: true,
        createdAt: true,
        lastUseAt: true,
      },
      order,
      take: query.limit ?? 10,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
    });

    // Password ni olib tashlash
    const usersWithoutPassword = users.map((user: any) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      data: usersWithoutPassword as any,
      total,
    };
  }

  // 🆕 Har qanday user'ni tgId orqali olish
  async getUserById(tgId: number | string): Promise<UserDto | null> {
    const tgIdNumber = typeof tgId === 'string' ? Number(tgId) : tgId;
    
    const user = await this.repository.findOne({
      where: { tgId: tgIdNumber, deletedAt: IsNull() } as any,
      select: {
        _id: true,
        id: true,
        firstName: true,
        lastName: true,
        tgFirstName: true,
        tgLastName: true,
        tgUsername: true,
        tgId: true,
        username: true,
        phoneNumber: true,
        email: true,
        address: true,
        birthday: true,
        gender: true,
        status: true,
        role: true,
        createdAt: true,
        lastUseAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Password ni olib tashlash
    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword as any;
  }

  // 🆕 Admin'ni tgId orqali olish
  async getAdminByTgId(tgId: number | string): Promise<UserDto | null> {
    const tgIdNumber = typeof tgId === 'string' ? Number(tgId) : tgId;
    
    const user = await this.repository.findOne({
      where: { tgId: tgIdNumber, deletedAt: IsNull() } as any,
      select: {
        _id: true,
        id: true,
        firstName: true,
        lastName: true,
        tgFirstName: true,
        tgLastName: true,
        tgUsername: true,
        tgId: true,
        username: true,
        phoneNumber: true,
        email: true,
        address: true,
        birthday: true,
        gender: true,
        status: true,
        role: true,
        createdAt: true,
        lastUseAt: true,
      },
    });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      return null;
    }

    // Password ni olib tashlash
    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword as any;
  }

  // 🆕 Admin'ni tgId orqali update qilish
  async updateAdminByTgId(tgId: number | string, data: UserDto): Promise<UserDto | null> {
    const tgIdNumber = typeof tgId === 'string' ? Number(tgId) : tgId;
    
    const user = await this.repository.findOne({
      where: { tgId: tgIdNumber, deletedAt: IsNull() } as any,
      select: { _id: true, username: true, role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw UserException.NotFound();
    }

    if (data.username && user.tgId !== tgIdNumber) {
      const userByUsername = await this.repository.findOne({
        where: { username: data.username, deletedAt: IsNull() } as any,
        select: { _id: true },
      });

      if (userByUsername) {
        throw UserException.AllreadyExist('username');
      }
    }

    // Update data - faqat kerakli field'larni olish
    const updateData: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
      birthday: data.birthday ?? null,
      gender: data.gender,
      status: data.status,
      lang: data.lang,
      tgFirstName: data.tgFirstName,
      tgLastName: data.tgLastName,
      tgUsername: data.tgUsername,
    };

    // Parol yangilangan bo'lsa, shifrlash
    if (data.password) {
      if (data.password !== data.confirmPassword) {
        throw UserException.PasswordsDoNotMatch();
      }
      updateData.password = await this.hashPassword(data.password);
    }

    const updatedUser = await this.findByIdAndUpdate(user._id, updateData);

    if (!updatedUser || !('_id' in updatedUser)) {
      throw UserException.NotFound();
    }

    // Password ni qaytarmaslik
    const { password, ...userWithoutPassword } = updatedUser as any;
    return { ...userWithoutPassword, _id: updatedUser._id.toString(), id: updatedUser._id.toString() } as any;
  }
}
