import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserExplanationService } from './user-explanation.service';
import { CreateUserExplanationDto } from './dto/create-user-explanation.dto';
import { UpdateUserExplanationDto } from './dto/update-user-explanation.dto';

@Controller('user-explanation')
export class UserExplanationController {
  constructor(private readonly userExplanationService: UserExplanationService) {}

  @Post()
  create(@Body() createUserExplanationDto: CreateUserExplanationDto) {
    return this.userExplanationService.create(createUserExplanationDto);
  }

  @Get()
  findAll() {
    return this.userExplanationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userExplanationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserExplanationDto: UpdateUserExplanationDto) {
    return this.userExplanationService.update(+id, updateUserExplanationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userExplanationService.remove(+id);
  }
}
