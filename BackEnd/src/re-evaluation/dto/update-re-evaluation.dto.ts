import { PartialType } from '@nestjs/mapped-types';
import { CreateReEvaluationDto } from './create-re-evaluation.dto';

export class UpdateReEvaluationDto extends PartialType(CreateReEvaluationDto) {}
