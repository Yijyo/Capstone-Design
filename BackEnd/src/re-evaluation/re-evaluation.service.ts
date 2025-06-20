import { Injectable } from '@nestjs/common';
import { CreateReEvaluationDto } from './dto/create-re-evaluation.dto';
import { UpdateReEvaluationDto } from './dto/update-re-evaluation.dto';

@Injectable()
export class ReEvaluationService {
  create(createReEvaluationDto: CreateReEvaluationDto) {
    return 'This action adds a new reEvaluation';
  }

  findAll() {
    return `This action returns all reEvaluation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reEvaluation`;
  }

  update(id: number, updateReEvaluationDto: UpdateReEvaluationDto) {
    return `This action updates a #${id} reEvaluation`;
  }

  remove(id: number) {
    return `This action removes a #${id} reEvaluation`;
  }
}
