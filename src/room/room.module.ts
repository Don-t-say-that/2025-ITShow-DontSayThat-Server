import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { WaitingRoomGateway } from './room.gateway';
import { ForbiddenWord } from './entity/room.entity';
import { RoomService } from './room.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([ForbiddenWord]),
    forwardRef(() => UsersModule),
    TeamsModule],
  providers: [WaitingRoomGateway, RoomService],
  exports: [WaitingRoomGateway, RoomService],
})
export class RoomModule { }