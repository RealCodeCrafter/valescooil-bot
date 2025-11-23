import { Expose, Transform } from 'class-transformer';
import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';
import { PagingDto } from '../../../common/validation/dto/paging.dto';
import { CommonDtoGroup } from '../../../common/validation/dto/common.dto';

export class DashboardCodesDtoGroup extends CommonDtoGroup {}

export class DashboardCodesDto extends PagingDto {
  @IsOptional({ groups: [DashboardCodesDtoGroup.PAGINATION] })
  @IsMongoId({ groups: [DashboardCodesDtoGroup.PAGINATION] })
  giftId?: string;

  @Expose({ toClassOnly: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((item) => item?.toString().trim()).filter((item) => !!item);
    }
    return value
      .toString()
      .split(',')
      .map((item) => item.trim())
      .filter((item) => !!item);
  })
  @IsOptional({ groups: [DashboardCodesDtoGroup.PAGINATION] })
  @IsArray({ groups: [DashboardCodesDtoGroup.PAGINATION] })
  @IsString({ each: true, groups: [DashboardCodesDtoGroup.PAGINATION] })
  giftNames?: string[];
}





