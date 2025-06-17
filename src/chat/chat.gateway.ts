import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { AddChatDto } from './dto/addChat.dto';

// origin 변경하기
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected to chat: ${client.id}`);
  }
  handleConnection(client: Socket) {
    console.log(`Client connected to chat: ${client.id}`);
  }

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody()
    addChatDto: AddChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const saved = await this.chatService.checkForbiddenWord(addChatDto);

    const roomName = `room-${addChatDto.teamId}`;
    client.to(roomName).emit('chat', saved);
    return saved;
  }

  private gameTimers = new Map<number, NodeJS.Timeout>();

  @SubscribeMessage('startGameTimer')
  handleStartGameTimer(
    @MessageBody() data: { teamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;

    if (this.gameTimers.has(data.teamId)) {
      return; // 이미 타이머 실행 중이면 무시
    }

    let seconds = 90; // 1분 30초

    const interval = setInterval(() => {
      if (seconds <= 0) {
        clearInterval(interval);
        client.to(roomName).emit('gameEnd');
        return;
      }
      client.to(roomName).emit('timer', seconds);
      seconds--;
    }, 1000);
  }
}
