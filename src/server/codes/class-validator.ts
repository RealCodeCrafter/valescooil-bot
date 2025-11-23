import { Transform } from 'class-transformer';
import { 
  IsBoolean, 
  IsMongoId, 
  IsOptional, 
  IsString, 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments, 
  Validate 
} from 'class-validator';
import { PagingDto } from '../../common/validation/dto/paging.dto';
import { CommonDto, CommonDtoGroup } from '../../common/validation/dto/common.dto';

/**
 * Custom validator for Gift ID
 */
@ValidatorConstraint({ name: 'isCodeGiftId', async: false })
class IsCodeGiftId implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments) {
    // Example: must be non-empty string, or implement your real check
    return typeof value === 'string' && value.trim().length > 0;
  }

  defaultMessage(args: ValidationArguments) {
    // Show invalid value in message
    return `"${args.value}" is not a valid Gift ID!`;
  }
}

export class CodeDtoGroup extends CommonDtoGroup {
  static readonly CHECK_CODE = 'CHECK_CODE';
  static readonly GET_USED_BY_USER_ID = 'GET_USED_BY_USER_ID';
}

export class CodeDto extends CommonDto {
  id: number;

  @IsString({ groups: [CodeDtoGroup.CHECK_CODE] })
  value: string;

  @IsOptional({ groups: [CodeDtoGroup.UPDATE] })
  @IsMongoId({ groups: [CodeDtoGroup.UPDATE] })
  giftId: string | null;

  isUsed: boolean;

  @IsMongoId({ groups: [CodeDtoGroup.GET_USED_BY_USER_ID] })
  usedById: string;

  usedAt: string;
}

export class CodePagingDto extends PagingDto {
  @IsOptional({ groups: [CodeDtoGroup.PAGINATION] })
  @IsString({ groups: [CodeDtoGroup.PAGINATION] })
  @Validate(IsCodeGiftId, ['withGift'], { groups: [CodeDtoGroup.PAGINATION] })
  giftId?: string | null;

  @Transform(({ value }) => 
    value === 'true' ? true : value === 'false' ? false : null, 
    { groups: [CodeDtoGroup.PAGINATION] }
  )
  @IsOptional({ groups: [CodeDtoGroup.PAGINATION] })
  @IsBoolean({ groups: [CodeDtoGroup.PAGINATION] })
  isUsed?: boolean | null | undefined;
}
