import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { AddChatDto } from './dto/addChat.dto';

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

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}
  private gameTimers = new Map<number, NodeJS.Timeout>();

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
  ) {
    const saved = await this.chatService.checkForbiddenWord(addChatDto);
    const roomName = `room-${addChatDto.teamId}`;

    this.server.to(roomName).emit('chat', saved);

    return saved;
  }

  @SubscribeMessage('startGameTimer')
  handleStartGameTimer(
    @MessageBody() data: { teamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;

    if (this.gameTimers.has(data.teamId)) {
      return; // 이미 타이머 실행 중이면 무시
    }

    let seconds = 90;

    const interval = setInterval(() => {
      if (seconds <= 0) {
        clearInterval(interval);
        this.gameTimers.delete(data.teamId);
        this.server.to(roomName).emit('gameEnd');
        return;
      }
      this.server.to(roomName).emit('timer', seconds);
      seconds--;
    }, 1000);

    this.gameTimers.set(data.teamId, interval);
  }
}
