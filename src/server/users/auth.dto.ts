import { JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../../db/entities/user.entity';

export interface UserWTPayloadInterface extends JwtPayload {
  _id: string;
  role: UserRole;
}

declare module 'express' {
  export interface Request {
    user?: UserWTPayloadInterface;
  }
}
