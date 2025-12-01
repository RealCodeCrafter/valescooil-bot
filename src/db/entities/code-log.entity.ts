// code-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Code } from './code.entity';
import { User } from './user.entity';

@Entity('code_logs')
export class CodeLog {
  @PrimaryGeneratedColumn('uuid')
  _id!: string;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @Column({ type: 'uuid', nullable: true })
  codeId!: string | null;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  deletedBy!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Code, code => code.logs, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'codeId' })
  code?: Code;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
