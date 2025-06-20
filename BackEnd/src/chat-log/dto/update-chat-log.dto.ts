import { PartialType } from '@nestjs/mapped-types';
import { CreateChatLogDto } from './create-chat-log.dto';

export class UpdateChatLogDto extends PartialType(CreateChatLogDto) {}
