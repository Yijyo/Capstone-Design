import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { MulterModule } from '@nestjs/platform-express';
import { User } from 'src/user/entities/user.entity';
import { AIResult } from 'src/ai-result/entities/ai-result.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, User, AIResult]),
    MulterModule.register({
      dest: './uploads/videos',
    }),
    HttpModule,
    ConfigModule,
  ],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
