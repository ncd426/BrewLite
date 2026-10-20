import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  } as unknown as UsersService;
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  } as unknown as JwtService;
  const authService = new AuthService(usersService, jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes a new account password and returns a signed JWT', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue(null);
    usersService.create = jest.fn().mockImplementation(async (user) => ({
      id: 12,
      ...user,
      loyaltyPoints: 0,
    }));

    await expect(
      authService.register(' Person@Example.com ', 'secret123'),
    ).resolves.toEqual({
      id: 12,
      email: 'person@example.com',
      accessToken: 'signed-token',
    });

    const [createdUser] = (usersService.create as jest.Mock).mock.calls[0];
    expect(createdUser.email).toBe('person@example.com');
    expect(createdUser.passwordHash).not.toBe('secret123');
    await expect(bcrypt.compare('secret123', createdUser.passwordHash)).resolves
      .toBe(true);
  });

  it('rejects an incorrect password with 401 Unauthorized', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue({
      id: 12,
      email: 'person@example.com',
      passwordHash: await bcrypt.hash('correct-password', 10),
      loyaltyPoints: 0,
    });

    await expect(
      authService.login('person@example.com', 'incorrect-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
