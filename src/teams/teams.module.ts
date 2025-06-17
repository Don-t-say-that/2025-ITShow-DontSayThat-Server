import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { User } from '../users/entities/user.entity';
import { RoomModule } from 'src/room/room.module';
import { ChatModule } from '../chat/chat.module';
import { GameResult } from 'src/chat/entity/gameResult.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, User, GameResult]),
    forwardRef(() => RoomModule),
    forwardRef(() => ChatModule),
  ],
  providers: [TeamsService],
  controllers: [TeamsController],
  exports: [TeamsService, TypeOrmModule],
})
export class TeamsModule {}
