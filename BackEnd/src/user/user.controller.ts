import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { BaseResponseDto } from 'src/common/base-response.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    async getAllUsers() : Promise<User[]> {
        const users = await this.userService.getAllUsers();
        return users;
    }

    @Get(':email')
    async getUserByEmail(@Param('email') email: string) : Promise<User> {
        const user = await this.userService.getUserByEmail(email);
        return user;
    }

    @Delete(':email')
    async deleteUserByEmail(@Param('email') email: string) : Promise<BaseResponseDto<User>> {
        const user = await this.userService.deleteUserByEmail(email);
        return new BaseResponseDto<User>(200, 'Success', user);
    }
}
