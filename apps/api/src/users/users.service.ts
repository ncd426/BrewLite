import { Injectable } from '@nestjs/common';

export type UserRecord = {
  id: number;
  email: string;
  passwordHash: string;
  loyaltyPoints: number;
};

@Injectable()
export class UsersService {
  private readonly users = new Map<string, UserRecord>();

  create(user: Omit<UserRecord, 'id'> & { id?: number }): UserRecord {
    const id = user.id ?? this.users.size + 1;
    const record: UserRecord = {
      id,
      email: user.email,
      passwordHash: user.passwordHash,
      loyaltyPoints: user.loyaltyPoints ?? 0,
    };

    this.users.set(record.email, record);
    return record;
  }

  findByEmail(email: string): UserRecord | undefined {
    return [...this.users.values()].find((user) => user.email === email);
  }
}
