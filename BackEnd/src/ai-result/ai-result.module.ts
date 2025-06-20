import { Module } from '@nestjs/common';
import { AIResultService } from './ai-result.service';
import { AIResultController } from './ai-result.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIResult } from './entities/ai-result.entity';
import { HttpModule } from '@nestjs/axios';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIResult, User]),
    HttpModule
  ],
  controllers: [AIResultController],
  providers: [AIResultService],
  exports: [AIResultService]
})
export class AIResultModule {}
