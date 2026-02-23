/**
 * @module auth/domain
 * @description Entity classes for authentication
 * @safety RED
 */

import type { User, Session } from './auth.types';

export class UserEntity implements User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(data: User): UserEntity {
    return new UserEntity(data.id, data.email, data.createdAt, data.updatedAt);
  }
}

export class SessionEntity implements Session {
  constructor(
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date
  ) {}

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  static create(data: Session): SessionEntity {
    return new SessionEntity(data.userId, data.token, data.expiresAt);
  }
}
