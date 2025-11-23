import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PagingDto } from '../../../common/validation/dto/paging.dto';
import { CommonDtoGroup } from '../../../common/validation/dto/common.dto';

export enum DashboardGiftCodeStatus {
  ALL = 'all',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
}

export class DashboardGiftCodesDtoGroup extends CommonDtoGroup {}

export class DashboardGiftCodesDto extends PagingDto {
  @Transform(({ value }) => value ?? DashboardGiftCodeStatus.ASSIGNED, {
    groups: [DashboardGiftCodesDtoGroup.PAGINATION],
  })
  @IsOptional({ groups: [DashboardGiftCodesDtoGroup.PAGINATION] })
  @IsEnum(DashboardGiftCodeStatus, { groups: [DashboardGiftCodesDtoGroup.PAGINATION] })
  status?: DashboardGiftCodeStatus;
}





