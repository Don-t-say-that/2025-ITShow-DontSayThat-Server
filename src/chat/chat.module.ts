import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage } from './entity/chat.entity';
import { GameResult } from './entity/gameResult.entity';
import { ForbiddenWord } from 'src/room/entity/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, GameResult, ForbiddenWord])],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
