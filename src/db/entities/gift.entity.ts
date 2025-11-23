import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type GiftType = 'premium' | 'standard' | 'economy' | 'symbolic';

@Entity('gifts')
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  _id!: string;

  @Column({ type: 'int', unique: true })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: ['premium', 'standard', 'economy', 'symbolic'] })
  type!: GiftType;

  @Column({ type: 'varchar', length: 500 })
  image!: string;

  @Column({ type: 'jsonb' })
  images!: { uz: string; ru: string };

  @Column({ type: 'int', default: 0 })
  totalCount!: number;

  @Column({ type: 'int', default: 0 })
  usedCount!: number;

  @Column({ type: 'uuid', nullable: true })
  deletedBy!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


