import {
  Controller,
  Get,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

type AuthenticatedUser = { userId: number; email: string };

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.usersService.findPublicById(user.userId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return profile;
  }
}
