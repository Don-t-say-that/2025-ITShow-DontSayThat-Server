import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, User])
  ],
  providers: [TeamsService],
  controllers: [TeamsController],
})
export class TeamsModule {}
