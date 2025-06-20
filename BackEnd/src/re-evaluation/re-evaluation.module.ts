import { Module } from '@nestjs/common';
import { ReEvaluationService } from './re-evaluation.service';
import { ReEvaluationController } from './re-evaluation.controller';

@Module({
  controllers: [ReEvaluationController],
  providers: [ReEvaluationService],
})
export class ReEvaluationModule {}
