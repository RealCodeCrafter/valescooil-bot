import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { PagingDto } from '../../common/validation/dto/paging.dto';
import { CommonDto, CommonDtoGroup } from '../../common/validation/dto/common.dto';
import { regexps } from '../../common/constant/regex';
import { Gender, UserStatus, UserRole } from '../../db/entities/user.entity';

/**
 * Guruhlar
 */
export class AuthDtoGroup extends CommonDtoGroup {
  static readonly LOGIN = 'login';
  static readonly CHANGE_PASSWORD = 'change_password';
}

export class UserDtoGroup extends CommonDtoGroup {
  static readonly PARAM_IDS = 'param_ids';
}

/**
 * Auth DTO (agar kerak bo‘lsa)
 */
export class AuthDto {
  @IsString({ groups: [AuthDtoGroup.LOGIN] })
  username: string;

  @IsString({ groups: [AuthDtoGroup.LOGIN, AuthDtoGroup.CHANGE_PASSWORD] })
  password: string;
}

/**
 * User DTO
 *
 * Qoidalar:
 * - Ko‘pchilik maydonlar CREATE guruhida talab qilinadi (IsString with CREATE),
 *   UPDATE guruhida esa optional.
 * - tgId uchun raqam kutiladi: @Type(() => Number) + @IsInt()
 */
export class UserDto extends CommonDto {
  // name
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  firstName: string;

  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  lastName?: string;

  // birthday can be omitted; if present must match regex (YYYY-MM-DD-like)
  @IsOptional({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  @Matches(regexps.PG_DATE_FORMAT, {
    groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE],
  })
  birthday?: string;

  @IsOptional({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  email?: string;

  @IsOptional({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  address?: string;

  // password / confirmPassword
  @IsOptional({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  password?: string;

  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  confirmPassword?: string;

  // username
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  username: string;

  // Telegram ID — raqam sifatida kelyapti deb hisoblaymiz
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @Type(() => Number)
  @IsInt({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  tgId!: number;

  // language
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  lang!: string;

  // Telegram fields
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  tgFirstName!: string;

  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  tgLastName?: string;

  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  tgUsername: string;

  // phone
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  phoneNumber?: string;

  // otp related
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  otp?: string;

  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  otpSend?: Date;

  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  otpRetry?: number;

  // gender enum
  @IsOptional({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  @IsEnum(Gender, { groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  gender!: Gender;

  // image
  @IsOptional({ groups: [UserDtoGroup.UPDATE] })
  @IsString({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  image?: string;

  // status enum
  @IsOptional({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  @IsEnum(UserStatus, { groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  status!: UserStatus;

  @IsOptional({ groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  @IsEnum(UserRole, { groups: [UserDtoGroup.CREATE, UserDtoGroup.UPDATE] })
  role?: UserRole;
}

/**
 * Paging DTO (unchanged)
 */
export class GetUsersRequestDto extends PagingDto {}

/**
 * Login DTO — eslatma: controller’da validateIt(..., [CommonDtoGroup.CREATE]) chaqiriladi,
 * shuning uchun bu yerda CommonDtoGroup.CREATE/UPDATE ishlatildi.
 */
export class UserLoginRequestDto {
  @IsString({ groups: [CommonDtoGroup.CREATE] })
  username: string;

  @IsString({ groups: [CommonDtoGroup.CREATE] })
  password: string;

  @IsOptional({ groups: [CommonDtoGroup.UPDATE] })
  @IsString({ groups: [CommonDtoGroup.UPDATE] })
  refreshToken: string;
}
