import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SignUpDto } from '../auth/dto/signup.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}
    
    async createUser(createUserDto: SignUpDto) : Promise<User> {
        const user = this.userRepository.create(createUserDto);
        try {
            await this.userRepository.save(user);
            return user;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('이미 존재하는 이메일입니다.');
            }
            throw new InternalServerErrorException('사용자 생성 중 오류가 발생했습니다.');
        }
    }

    async getAllUsers() : Promise<User[]> {
        return await this.userRepository.find();
    }

    async getUserByEmail(email: string) : Promise<User> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async deleteUserByEmail(email: string) : Promise<User> {
        const user = await this.getUserByEmail(email);
        await this.userRepository.remove(user);
        return user;
    }
}
