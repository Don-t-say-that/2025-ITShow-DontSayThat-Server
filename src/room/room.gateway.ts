import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { UsersService } from 'src/users/users.service';

interface CustomSocket extends Socket {
  data: {
    roomName?: string;
  };
}

const allowedOrigins = [
  'http://localhost:5173',
  'https://2025-it-show-dont-say-that-client.vercel.app',
];

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

export class WaitingRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly usersService: UsersService) { }

  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<number, string>();
  private socketUserMap = new Map<string, number>();
  private forbiddenWordsMap = new Map<number, string>();
  private readyUsersMap = new Map<number, Set<number>>();

  handleConnection(client: Socket) {
    console.log(`클라이언트 연결: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.forbiddenWordsMap.delete(userId);

      this.readyUsersMap.forEach((readyUsers, teamId) => {
        readyUsers.delete(userId);
      });
    }
  }

  @SubscribeMessage('enterForbidden')
  handleEnterForbidden(
    @MessageBody() data: { teamId: number; userId: number; word: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { teamId, userId, word } = data;

    this.forbiddenWordsMap.set(userId, word);
    console.log(`사용자 ${userId} 금칙어 입력: ${word}`);

    if (!this.readyUsersMap.has(teamId)) {
      this.readyUsersMap.set(teamId, new Set());
    }
    const readyUsers = this.readyUsersMap.get(teamId);
    if (readyUsers) {
      readyUsers.add(userId);
    }

    const roomName = `room-${teamId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);

    if (room && readyUsers) {
      const totalUsers = room.size;
      const readyCount = readyUsers.size;

      this.server.to(roomName).emit('readyStatus', {
        readyUsers: Array.from(readyUsers),
        totalUsers: totalUsers,
        readyCount: readyCount
      });

      if (totalUsers === readyCount) {
        this.server.to(roomName).emit('allUsersReady');

        setTimeout(() => {
          this.readyUsersMap.delete(teamId);
        }, 5000);
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { teamId: number; userId?: number },
    @ConnectedSocket() client: CustomSocket,
  ) {
    const roomName = `room-${data.teamId}`;
    client.join(roomName);

    if (data.userId) {
      this.userSocketMap.set(data.userId, client.id);
      this.socketUserMap.set(client.id, data.userId);

      const userData = await this.usersService.getFullUserData(data.userId);
      // 본인을 제외한 다른 사용자들에게만 알림
      client.to(roomName).emit('userJoined', userData);

      const readyUsers = this.readyUsersMap.get(data.teamId);
      if (readyUsers && readyUsers.size > 0) {
        const room = this.server.sockets.adapter.rooms.get(roomName);
        const totalUsers = room ? room.size : 0;

        client.emit('readyStatus', {
          readyUsers: Array.from(readyUsers),
          totalUsers: totalUsers,
          readyCount: readyUsers.size
        });
      }
    }

    const room = this.server.sockets.adapter.rooms.get(roomName);
    if (room) {
      console.log(`${roomName} 방 :`, Array.from(room));
    }
  }

  @SubscribeMessage('userJoined')
  handleUserJoined(
    @MessageBody() data: { teamId: number; userData: any },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;
    client.to(roomName).emit('userJoined', data.userData);
  }

  @SubscribeMessage('userLeft')
  handleUserLeft(
    @MessageBody() data: { teamId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;

    const readyUsers = this.readyUsersMap.get(data.teamId);
    if (readyUsers) {
      readyUsers.delete(data.userId);

      const room = this.server.sockets.adapter.rooms.get(roomName);
      const totalUsers = room ? room.size - 1 : 0; // 현재 나가는 사용자 제외

      this.server.to(roomName).emit('readyStatus', {
        readyUsers: Array.from(readyUsers),
        totalUsers: totalUsers,
        readyCount: readyUsers.size
      });
    }

    const socketId = this.userSocketMap.get(data.userId);
    if (socketId) {
      this.userSocketMap.delete(data.userId);
      this.socketUserMap.delete(socketId);
    }

    this.server.to(roomName).emit('userLeft', { userId: data.userId });
    client.leave(roomName);
  }

  @SubscribeMessage('updateUsers')
  handleUpdateUsers(
    @MessageBody() data: { teamId: number; users: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;
    this.server.to(roomName).emit('usersUpdated', data.users);
  }

  @SubscribeMessage('characterSelected')
  handleCharacterSelected(
    @MessageBody()
    data: {
      teamId: number;
      userId: number;
      characterId: number;
      character: string;
    },
  ) {
    const roomName = `room-${data.teamId}`;

    this.server.to(roomName).emit('characterSelected', {
      userId: data.userId,
      characterId: data.characterId,
      character: data.character,
    });
  }

  @SubscribeMessage('startGame')
  handleStartGame(
    @MessageBody() data: { teamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;
    this.server.to(roomName).emit('goToForbidden');
  }

  @SubscribeMessage('resetReady')
  handleResetReady(
    @MessageBody() data: { teamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.readyUsersMap.delete(data.teamId);

    const roomName = `room-${data.teamId}`;
    this.server.to(roomName).emit('readyStatus', {
      readyUsers: [],
      totalUsers: 0,
      readyCount: 0
    });
  }

  notifyUserJoined(teamId: number, userData: any) {
    const roomName = `room-${teamId}`;

    const room = this.server.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;

    if (clientCount === 0) {
      return;
    }

    this.server.to(roomName).emit('userJoined', userData);
  }

  notifyCharacterSelected(
    teamId: number,
    data: { userId: number; characterId: number; character: string },
  ) {
    const roomName = `room-${teamId}`;
    this.server.to(roomName).emit('characterSelected', data);
  }

  notifyUserLeft(teamId: number, userId: number) {
    const roomName = `room-${teamId}`;

    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(socketId);
    }

    const readyUsers = this.readyUsersMap.get(teamId);
    if (readyUsers) {
      readyUsers.delete(userId);
    }

    const room = this.server.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;

    this.server.to(roomName).emit('userLeft', { userId });

    this.server.sockets.emit('userCountUpdated', {
      teamId,
      userCount: clientCount,
    });

    if (readyUsers) {
      this.server.to(roomName).emit('readyStatus', {
        readyUsers: Array.from(readyUsers),
        totalUsers: clientCount,
        readyCount: readyUsers.size
      });
    }
  }

  notifyTeamCreated(teamData: any) {

    this.server.sockets.emit('teamCreated', {
      id: teamData.id,
      name: teamData.name,
      leaderId: teamData.leader?.id,
      leaderName: teamData.leader?.name,
      userCount: 1,
      status: teamData.status || 'waiting',
    });
  }

  notifyTeamDeleted(teamId: number) {
    this.server.sockets.emit('teamDeleted', { teamId });
    this.readyUsersMap.delete(teamId);
  }
}