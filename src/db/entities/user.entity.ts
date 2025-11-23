import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Generated,
} from 'typeorm';

export enum Gender {
  Male = 'MALE',
  Female = 'FEMALE',
  NotSet = 'NOT_SET',
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCK = 'block',
}

export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
@Index(['tgId', 'deletedAt'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  _id!: string;

  @Column({ type: 'int' })
  @Generated('increment')
  id!: number;

  @Column({ type: 'bigint' })
  tgId!: number;

  @Column({ type: 'varchar', length: 10, default: 'uz' })
  lang!: string;

  @Column({ type: 'varchar', length: 255 })
  tgFirstName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tgLastName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tgUsername?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  firstName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  otp?: string;

  @Column({ type: 'timestamp', nullable: true })
  otpSend?: Date;

  @Column({ type: 'int', default: 0 })
  otpRetry?: number;

  @Column({ type: 'enum', enum: Gender, default: Gender.NotSet })
  gender!: Gender;

  @Column({ type: 'varchar', length: 50, nullable: true })
  birthday?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'int', default: 0 })
  balance!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUseAt!: Date;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'uuid', nullable: true })
  deletedBy!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


