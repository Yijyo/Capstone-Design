import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatLogService } from './chat-log.service';
import { CreateChatLogDto } from './dto/create-chat-log.dto';
import { UpdateChatLogDto } from './dto/update-chat-log.dto';

@Controller('chat-log')
export class ChatLogController {
  constructor(private readonly chatLogService: ChatLogService) {}

  @Post()
  create(@Body() createChatLogDto: CreateChatLogDto) {
    return this.chatLogService.create(createChatLogDto);
  }

  @Get()
  findAll() {
    return this.chatLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatLogService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatLogDto: UpdateChatLogDto) {
    return this.chatLogService.update(+id, updateChatLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatLogService.remove(+id);
  }
}
