import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { BaseResponseDto } from 'src/common/base-response.dto';
import { User } from 'src/user/entities/user.entity';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    async signUp(@Body() signUpDto: SignUpDto) : Promise<BaseResponseDto<User>> {
        const newUser = await this.authService.signUp(signUpDto);
        return new BaseResponseDto<User>(200, 'Success', newUser);
    }

    @Post('signin')
    async signIn(@Body() signInDto: SignInDto): Promise<BaseResponseDto<{ token: string, userId: number }>> {
        const { token, userId } = await this.authService.signIn(signInDto);
        return new BaseResponseDto(200, '로그인이 성공적으로 완료되었습니다.', { token, userId });
    }
}