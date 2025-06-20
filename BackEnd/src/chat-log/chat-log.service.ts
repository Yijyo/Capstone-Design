import { Injectable } from '@nestjs/common';
import { CreateChatLogDto } from './dto/create-chat-log.dto';
import { UpdateChatLogDto } from './dto/update-chat-log.dto';

@Injectable()
export class ChatLogService {
  create(createChatLogDto: CreateChatLogDto) {
    return 'This action adds a new chatLog';
  }

  findAll() {
    return `This action returns all chatLog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chatLog`;
  }

  update(id: number, updateChatLogDto: UpdateChatLogDto) {
    return `This action updates a #${id} chatLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} chatLog`;
  }
}
