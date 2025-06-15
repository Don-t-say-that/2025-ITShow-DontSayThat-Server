import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CustomSocket } from 'src/character/character.gateway';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/wait' })
export class WaitingRoomGateway {
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { teamId: number },
    @ConnectedSocket() client: CustomSocket,
  ) {
    await client.join(`room-${data.teamId}`);
    client.data.roomId = `room-${data.teamId}`; // CharacterGateway에서도 활용 가능하도록 저장
    console.log(`${client.id} joined room-${data.teamId}`);
  }

  @SubscribeMessage('toggleReady')
  handleToggleReady(
    @MessageBody() data: { teamId: number; userId: number; isReady: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;
    client.to(roomName).emit('userReadyToggled', {
      userId: data.userId,
      isReady: data.isReady,
    });
  }
}
