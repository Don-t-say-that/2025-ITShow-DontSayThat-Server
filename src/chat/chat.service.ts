import { Injectable } from '@nestjs/common';
import { AddChatDto } from './dto/addChat.dto';
import { ChatMessage } from './entity/chat.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
  ) {}

  async addMessage(addChatDto: AddChatDto) {
    const message = this.chatRepo.create({
      content: addChatDto.content,
      user: { id: addChatDto.userId },
      team: { id: addChatDto.teamId },
    });

    return this.chatRepo.save(message);
  }
}
