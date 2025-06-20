import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { Query } from './query.entity';
import { User } from 'src/user/entities/user.entity';
import { AIResult } from 'src/ai-result/entities/ai-result.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query, User, AIResult]),
    HttpModule,
    ConfigModule
  ],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService]
})
export class QueryModule {}