import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../db/entities/user.entity';
import { BaseService } from '../base.service';
import { UserException } from './error';
import { ENV } from '../../common/config/config';
import { UserDto } from './class-validator';
import { UserWTPayloadInterface } from './auth.dto';
import { Repository, In, IsNull, Like } from 'typeorm';
import { AppDataSource } from '../../db/connect.db';

const defaultSaltOrRounds = 10;

export class UserAuthService<Dto> extends BaseService<User, Dto> {
  constructor(repository: Repository<User>) {
    super(repository);
  }

  async login({ username, password }) {
    const user = await this.repository.findOne({
      where: {
        username: username,
        deletedAt: IsNull(),
        role: In([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
      } as any,
      select: { _id: true, password: true, role: true },
    });

    if (!user || !(await this.comparePassword(password, user.password || ''))) {
      throw UserException.Unauthorized();
    }

    const jwtPayload: UserWTPayloadInterface = { _id: user._id.toString(), role: user.role };
    return {
      accessToken: await this.signAsync(jwtPayload, 'access'),
      refreshToken: await this.signAsync(jwtPayload, 'refresh'),
      role: user.role,
    };
  }

  async getMe(id: string): Promise<Partial<UserDto>> {
    const user = await this.repository.findOne({
      where: {
        _id: id,
        deletedAt: IsNull(),
      } as any,
      select: {
        _id: true,
        firstName: true,
        lastName: true,
        tgFirstName: true,
        tgLastName: true,
        username: true,
        image: true,
        lang: true,
        phoneNumber: true,
        role: true,
        email: true,
        address: true,
        birthday: true,
        gender: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw UserException.NotFound();
    }

    return user as unknown as Partial<UserDto>;
  }

  async refreshToken(token: string) {
    const decoded = await this.authorizeUser(token, 'refresh');

    return {
      accessToken: await this.signAsync(decoded, 'access'),
      refreshToken: await this.signAsync(decoded, 'refresh'),
      role: decoded.role,
    };
  }

  async authorizeUser(token: string, tokenType: 'access' | 'refresh') {
    const decoded = await this.verifyJwt(token, tokenType);

    if (!decoded?._id) {
      throw UserException.Unauthorized();
    }

    const userId = decoded._id.toString();
    
    // UUID formatini tekshirish
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw UserException.Unauthorized();
    }

    const user = await this.repository.findOne({
      where: { _id: userId, deletedAt: IsNull() } as any,
      select: { role: true },
    });

    if (!user) {
      throw UserException.Unauthorized();
    }

    return {
      _id: userId,
      role: user.role,
    };
  }

  async hashPassword(password: string | Buffer, saltOrRounds?: number | string): Promise<string> {
    let salt: string | number = saltOrRounds
      ? typeof saltOrRounds === 'number'
        ? await bcrypt.genSalt(saltOrRounds)
        : saltOrRounds
      : await bcrypt.genSalt(defaultSaltOrRounds);

    return await bcrypt.hash(password, salt);
  }

  private async comparePassword(password: string, encrypted: string): Promise<boolean> {
    return await bcrypt.compare(password, encrypted);
  }

  private signAsync(
    payload: UserWTPayloadInterface,
    tokenType: 'access' | 'refresh',
    options?: jwt.SignOptions,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        tokenType === 'access' ? ENV.JWT_SECRET_ACCESS : ENV.JWT_SECRET_REFRESH,
        options,
        (err: Error | null, token: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        },
      );
    });
  }

  private verifyJwt(token: string, tokenType: 'access' | 'refresh'): Promise<UserWTPayloadInterface> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        tokenType === 'access' ? ENV.JWT_SECRET_ACCESS : ENV.JWT_SECRET_REFRESH,
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded as UserWTPayloadInterface);
          }
        },
      );
    });
  }
}
