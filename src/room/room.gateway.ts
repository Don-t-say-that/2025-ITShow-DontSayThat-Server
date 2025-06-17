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

@WebSocketGateway({ cors: { origin: '*' } })
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
    console.log(`클라이언트 연결 해제: ${client.id}`);
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

      console.log(`팀 ${teamId}: 준비 완료 ${readyCount}/${totalUsers}명`);

      this.server.to(roomName).emit('readyStatus', {
        readyUsers: Array.from(readyUsers),
        totalUsers: totalUsers,
        readyCount: readyCount
      });

      if (totalUsers === readyCount) {
        console.log(`팀 ${teamId}: 모든 사용자가 준비 완료`);
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
    console.log(`${client.id} 참가 ${roomName}`);

    if (data.userId) {
      this.userSocketMap.set(data.userId, client.id);
      this.socketUserMap.set(client.id, data.userId);
      console.log(`${data.userId} 소켓 ${client.id} 매핑 저장`);

      const userData = await this.usersService.getFullUserData(data.userId);
      this.server.to(roomName).emit('userJoined', userData);

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
    console.log(`새 사용자 입장:`, data.userData);
    client.to(roomName).emit('userJoined', data.userData);
  }

  @SubscribeMessage('userLeft')
  handleUserLeft(
    @MessageBody() data: { teamId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;
    console.log(`사용자 퇴장: ${data.userId}`);

    const readyUsers = this.readyUsersMap.get(data.teamId);
    if (readyUsers) {
      readyUsers.delete(data.userId);

      const room = this.server.sockets.adapter.rooms.get(roomName);
      const totalUsers = room ? room.size : 0;

      this.server.to(roomName).emit('readyStatus', {
        readyUsers: Array.from(readyUsers),
        totalUsers: totalUsers,
        readyCount: readyUsers.size
      });
    }

    this.server.to(roomName).emit('userLeft', { userId: data.userId });
  }

  @SubscribeMessage('updateUsers')
  handleUpdateUsers(
    @MessageBody() data: { teamId: number; users: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.teamId}`;
    console.log(`사용자 목록 업데이트:`, data.users);
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
    console.log(
      `캐릭터 선택: 사용자 ${data.userId} -> 캐릭터 ${data.characterId}`,
    );

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
    console.log(`게임시작 - ${roomName}`);
    this.server.to(roomName).emit('goToForbidden');
  }

  @SubscribeMessage('resetReady')
  handleResetReady(
    @MessageBody() data: { teamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`팀 ${data.teamId} 준비 상태 초기화`);
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
    console.log(`notifyUserJoined 호출됨`);
    console.log(`roomName: ${roomName}`);
    console.log(`userData:`, userData);

    // 현재 연결된 클라이언트 수
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;
    console.log(` ${roomName} 클라이언트 수: ${clientCount}`);

    if (clientCount === 0) {
      console.log(`방에 연결된 클라이언트가 없음`);
      return;
    }

    this.server.to(roomName).emit('userJoined', userData);
    console.log(`userJoined 이벤트 전송 완료`);
  }

  notifyCharacterSelected(
    teamId: number,
    data: { userId: number; characterId: number; character: string },
  ) {
    const roomName = `room-${teamId}`;
    console.log(`캐릭터 선택 알림: ${roomName}`, data);
    this.server.to(roomName).emit('characterSelected', data);
  }

  notifyUserLeft(teamId: number, userId: number) {
    const roomName = `room-${teamId}`;
    console.log(`사용자 퇴장 알림 시작: ${roomName}`, userId);

    const room = this.server.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;
    console.log(`${roomName} 클라이언트 수: ${clientCount}`);

    if (clientCount === 0) {
      console.log(`방에 연결된 클라이언트가 없음`);
    } else {
      this.server.to(roomName).emit('userLeft', { userId });
      console.log(`userLeft 이벤트 전송 완료`);
    }

    const readyUsers = this.readyUsersMap.get(teamId);
    if (readyUsers) {
      readyUsers.delete(userId);

      const totalUsers = clientCount > 0 ? clientCount - 1 : 0; // 퇴장하는 사용자 제외

      console.log(`준비 상태 업데이트: ${readyUsers.size}/${totalUsers}`);

      this.server.to(roomName).emit('readyStatus', {
        readyUsers: Array.from(readyUsers),
        totalUsers: totalUsers,
        readyCount: readyUsers.size
      });
    }
  }

  notifyTeamCreated(teamData: any) {
    console.log(`notifyTeamCreated 호출`);
    console.log(`teamData:`, teamData);

    this.server.sockets.emit('teamCreated', {
      id: teamData.id,
      name: teamData.name,
      leaderId: teamData.leader?.id,
      leaderName: teamData.leader?.name,
      userCount: 1,
      status: teamData.status || 'waiting',
    });
    console.log(` teamCreated 이벤트 전송 완료`);
  }

  notifyTeamDeleted(teamId: number) {
    console.log(`notifyTeamDeleted 호출  팀 ID: ${teamId}`);
    this.server.sockets.emit('teamDeleted', { teamId });
    this.readyUsersMap.delete(teamId);
    console.log(`teamDeleted 이벤트 전송 완료`);
  }
}
