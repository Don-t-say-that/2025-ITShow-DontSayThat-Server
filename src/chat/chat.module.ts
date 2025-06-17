import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage } from './entity/chat.entity';
import { GameResult } from './entity/gameResult.entity';
import { ForbiddenWord } from 'src/room/entity/room.entity';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, GameResult, ForbiddenWord]),
  forwardRef(() => TeamsModule),],
  providers: [ChatGateway, ChatService, TypeOrmModule],
})
export class ChatModule { }
