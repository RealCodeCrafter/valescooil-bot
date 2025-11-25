import { QuerySort } from '../../common/validation/types';
import { User, UserRole } from '../../db/entities/user.entity';
import { UserAuthService } from './auth.service';
import { GetUsersRequestDto, UserDto } from './class-validator';
import { UserException } from './error';
import { AppDataSource } from '../../db/connect.db';
import { DeepPartial, IsNull, Like, Or } from 'typeorm';
import { Code } from '../../db/entities/code.entity';
import { Gift } from '../../db/entities/gift.entity';

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

  async findByIdAndUpdateUser(data: UserDto): Promise<UserDto | null> {
    const user = await this.repository.findOne({
      where: { _id: data._id } as any,
      select: { _id: true, username: true, role: true },
    });
    if (!user || user.role !== UserRole.ADMIN) {
      throw UserException.NotFound();
    }

    if (data.username && data._id.toString() !== user._id.toString()) {
      const userByUsername = await this.repository.findOne({
        where: { username: data.username } as any,
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
      updateData.password = await this.hashPassword(data.password);
    }

    const newUser = await this.findByIdAndUpdate(data._id, updateData);

    if (!newUser || !('_id' in newUser)) {
      throw UserException.NotFound();
    }

    // Password ni qaytarmaslik
    const { password, ...userWithoutPassword } = newUser as any;
    return { ...userWithoutPassword, _id: newUser._id.toString(), id: newUser._id.toString() } as any;
  }

  // 🆕 Umumiy user update qilish (USER, ADMIN, SUPER_ADMIN)
  async updateAnyUser(data: UserDto, allowRoleChange: boolean = false): Promise<UserDto | null> {
    const user = await this.repository.findOne({
      where: { _id: data._id, deletedAt: IsNull() } as any,
      select: { _id: true, username: true, role: true },
    });

    if (!user) {
      throw UserException.NotFound();
    }

    // Username takrorlanmasligini tekshirish
    if (data.username && data._id.toString() !== user._id.toString()) {
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

    // Role o'zgartirish faqat ruxsat berilganda
    if (allowRoleChange && data.role) {
      updateData.role = data.role;
    }

    // Parol yangilangan bo'lsa, shifrlash
    if (data.password) {
      if (data.password !== data.confirmPassword) {
        throw UserException.PasswordsDoNotMatch();
      }
      updateData.password = await this.hashPassword(data.password);
    }

    const updatedUser = await this.findByIdAndUpdate(data._id, updateData);

    if (!updatedUser || !('_id' in updatedUser)) {
      throw UserException.NotFound();
    }

    // Password ni qaytarmaslik
    const { password, ...userWithoutPassword } = updatedUser as any;
    return { ...userWithoutPassword, _id: updatedUser._id.toString(), id: updatedUser._id.toString() } as any;
  }

  // 🆕 Umumiy user delete qilish (USER, ADMIN, SUPER_ADMIN)
  async deleteAnyUser(id: string, deletedBy: string): Promise<string> {
    const user = await this.repository.findOne({
      where: { _id: id, deletedAt: IsNull() } as any,
      select: { _id: true, role: true },
    });

    if (!user) {
      throw UserException.NotFound();
    }

    // SUPER_ADMIN ni o'chirishni taqiqlash
    if (user.role === UserRole.SUPER_ADMIN) {
      throw UserException.NotEnoughPermission('Cannot delete SUPER_ADMIN');
    }

    return await this.deleteById(id, deletedBy);
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
}
