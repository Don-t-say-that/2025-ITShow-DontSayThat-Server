import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { User } from '../users/entities/user.entity';
import { RoomModule } from 'src/room/room.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, User]),
    forwardRef(() => RoomModule),
  ],
  providers: [TeamsService],
  controllers: [TeamsController],
  exports: [TeamsService, TypeOrmModule],
})
export class TeamsModule {}
