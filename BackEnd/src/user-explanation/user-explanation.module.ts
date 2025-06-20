import { Module } from '@nestjs/common';
import { UserExplanationService } from './user-explanation.service';
import { UserExplanationController } from './user-explanation.controller';

@Module({
  controllers: [UserExplanationController],
  providers: [UserExplanationService],
})
export class UserExplanationModule {}
