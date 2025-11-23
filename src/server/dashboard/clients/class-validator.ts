import { Expose, Transform } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PagingDto } from '../../../common/validation/dto/paging.dto';
import { CommonDtoGroup } from '../../../common/validation/dto/common.dto';

export class DashboardClientDtoGroup extends CommonDtoGroup {}

export class DashboardClientPagingDto extends PagingDto {
  @Expose({ toClassOnly: true })
  @Transform(({ value }) => value?.trim(), { groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsOptional({ groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsString({ groups: [DashboardClientDtoGroup.PAGINATION] })
  firstName?: string;

  @Expose({ toClassOnly: true })
  @Transform(({ value }) => value?.trim(), { groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsOptional({ groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsString({ groups: [DashboardClientDtoGroup.PAGINATION] })
  lastName?: string;

  @Expose({ toClassOnly: true })
  @Transform(({ value }) => value?.trim(), { groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsOptional({ groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsString({ groups: [DashboardClientDtoGroup.PAGINATION] })
  phoneNumber?: string;

  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined), {
    groups: [DashboardClientDtoGroup.PAGINATION],
  })
  @IsOptional({ groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsNumber({}, { groups: [DashboardClientDtoGroup.PAGINATION] })
  @Min(0, { groups: [DashboardClientDtoGroup.PAGINATION] })
  minGifts?: number;

  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined), {
    groups: [DashboardClientDtoGroup.PAGINATION],
  })
  @IsOptional({ groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsNumber({}, { groups: [DashboardClientDtoGroup.PAGINATION] })
  @Min(0, { groups: [DashboardClientDtoGroup.PAGINATION] })
  maxGifts?: number;

  @IsOptional({ groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsDateString({}, { groups: [DashboardClientDtoGroup.PAGINATION] })
  registeredFrom?: string;

  @IsOptional({ groups: [DashboardClientDtoGroup.PAGINATION] })
  @IsDateString({}, { groups: [DashboardClientDtoGroup.PAGINATION] })
  registeredTo?: string;
}

