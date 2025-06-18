import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { MoveCharacterDto } from './dto/moveCharacter.dto';

export interface CustomSocket extends Socket {
  data: {
    roomName?: string;
    teamId?: string;
  };
}

const allowedOrigins = [
  'http://localhost:5173',
  'https://2025-it-show-dont-say-that-client.vercel.app',
  'https://dontsaythat.mirim-it-show.site',
];

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

export class CharacterGateway {
  @SubscribeMessage('move')
  handleMove(
    @MessageBody() moveCharacterDto: MoveCharacterDto,
    @ConnectedSocket() client: CustomSocket,
  ) {
    const roomName = `room-${moveCharacterDto.teamId}`;

    if (roomName) {
      client.nsp.to(roomName).emit('player-moved', moveCharacterDto); // roomName의 모든 사람에게 보내기 (나 포함)
    }
  }
}
