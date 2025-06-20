import { Injectable } from '@nestjs/common';
import { CreateUserExplanationDto } from './dto/create-user-explanation.dto';
import { UpdateUserExplanationDto } from './dto/update-user-explanation.dto';

@Injectable()
export class UserExplanationService {
  create(createUserExplanationDto: CreateUserExplanationDto) {
    return 'This action adds a new userExplanation';
  }

  findAll() {
    return `This action returns all userExplanation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userExplanation`;
  }

  update(id: number, updateUserExplanationDto: UpdateUserExplanationDto) {
    return `This action updates a #${id} userExplanation`;
  }

  remove(id: number) {
    return `This action removes a #${id} userExplanation`;
  }
}
