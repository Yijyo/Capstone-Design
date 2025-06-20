import { Module } from '@nestjs/common';
import { ChatLogService } from './chat-log.service';
import { ChatLogController } from './chat-log.controller';

@Module({
  controllers: [ChatLogController],
  providers: [ChatLogService],
})
export class ChatLogModule {}
