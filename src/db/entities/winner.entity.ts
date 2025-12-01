import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Gift } from './gift.entity';
import { User } from './user.entity';

@Entity('winners')
@Index(['value'], { unique: true })
export class Winner {
  @PrimaryGeneratedColumn('uuid')
  _id!: string;

  @Column({ type: 'int', unique: true })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tier!: string | null;

  @Column({ type: 'uuid', nullable: true })
  giftId!: string | null;

  @Column({ type: 'boolean', default: false })
  isUsed!: boolean;

  @Column({ type: 'uuid', nullable: true })
  usedById!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  usedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  giftGivenAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  giftGivenBy!: string | null;

  @Column({ type: 'uuid', nullable: true })
  deletedBy!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  month!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Gift, { nullable: true })
  @JoinColumn({ name: 'giftId' })
  gift?: Gift;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usedById' })
  usedBy?: User;
}


