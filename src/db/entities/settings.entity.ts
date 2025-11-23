import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('settings')
@Index(['codeLimitPerUser'], { unique: true })
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  _id!: string;

  @Column({ type: 'jsonb' })
  codeLimitPerUser!: { status: boolean; value: number };

  @Column({ type: 'uuid', nullable: true })
  deletedBy!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


