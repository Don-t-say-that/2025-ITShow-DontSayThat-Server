import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { WaitingRoomGateway } from './room.gateway';

@Module({
  imports: [forwardRef(() => UsersModule), TeamsModule],
  providers: [WaitingRoomGateway],
  exports: [WaitingRoomGateway],
})
export class RoomModule {}