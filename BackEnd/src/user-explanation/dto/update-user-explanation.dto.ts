import { PartialType } from '@nestjs/mapped-types';
import { CreateUserExplanationDto } from './create-user-explanation.dto';

export class UpdateUserExplanationDto extends PartialType(CreateUserExplanationDto) {}
