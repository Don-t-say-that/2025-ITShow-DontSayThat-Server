import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class WaitingRoomGateway {
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { teamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room-${data.teamId}`);
    console.log(`${client.id} joined room-${data.teamId}`);
  }

  @SubscribeMessage('toggleReady')
  handleToggleReady(
    @MessageBody() data: { teamId: number; userId: number; isReady: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room-${data.teamId}`).emit('userReadyToggled', {
      userId: data.userId,
      isReady: data.isReady,
    });
  }
}
