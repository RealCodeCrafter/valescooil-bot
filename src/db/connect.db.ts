import { DataSource } from 'typeorm';
import { ENV } from '../common/config/config';
import { Code } from './entities/code.entity';
import { Winner } from './entities/winner.entity';
import { User } from './entities/user.entity';
import { Gift } from './entities/gift.entity';
import { Settings } from './entities/settings.entity';
import { CodeLog } from './entities/code-log.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: ENV.DB.POSTGRES.HOST,
  port: ENV.DB.POSTGRES.PORT,
  username: ENV.DB.POSTGRES.USERNAME,
  password: ENV.DB.POSTGRES.PASSWORD,
  database: ENV.DB.POSTGRES.DATABASE,
  entities: [Code, Winner, User, Gift, Settings, CodeLog],
  synchronize: ENV.ENVIRONMENT === 'development',
  logging: false, // SQL query loglarini o'chirish
});

export class PostgresDataBase {
  async initialize(): Promise<Error | null> {
    try {
      await AppDataSource.initialize();
      return null;
    } catch (err: any) {
      return err;
    }
  }

  async closeConnection(): Promise<Error | null> {
    try {
      await AppDataSource.destroy();
      return null;
    } catch (err: any) {
      return err;
    }
  }
}

export const postgresDataBase = new PostgresDataBase();
