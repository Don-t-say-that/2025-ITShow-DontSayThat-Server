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
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody()
    addChatDto: AddChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const saved = await this.chatService.addMessage(addChatDto);

    const roomName = `room-${addChatDto.teamId}`;
    client.to(roomName).emit('chat', saved);
    return saved;
  }
}
