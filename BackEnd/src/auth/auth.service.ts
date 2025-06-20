import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/signin.dto';
import { ConflictException, InternalServerErrorException, UnauthorizedException, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) {}

    async signUp(signUpDto: SignUpDto) : Promise<User> {
        const { name, email, password } = signUpDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            name,
            email,
            password: hashedPassword
        });
        
        try {
            await this.userRepository.save(user);
            return user;    
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('이미 존재하는 이메일입니다.');
            }
            throw new InternalServerErrorException('회원가입 중 오류가 발생했습니다.');
        }
    }

    async signIn(signInDto: SignInDto) : Promise<{token: string, userId: number}> {
        const { email, password } = signInDto;

        const user = await this.userRepository.findOne({
            where: { email },
        });
        if (!user) throw new NotFoundException('해당 이메일을 가진 사용자를 찾을 수 없습니다.');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');

        const token = this.jwtService.sign({ id: user.id, email: user.email });
        return { token, userId: user.id };
    }
}
