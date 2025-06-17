import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { WaitingRoomGateway } from 'src/room/room.gateway';
import { GetTeamDto } from './dto/get-team.dto';
import { GameResult } from 'src/chat/entity/gameResult.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GameResult)
    private readonly gameRankingRepository: Repository<GameResult>,
    private readonly waitingRoomGateway: WaitingRoomGateway,
  ) { }

  async getWaitingTeams(): Promise<any[]> {
    return this.teamRepository
      .createQueryBuilder('team')
      .leftJoin('team.users', 'user')
      .where('team.status = :status', { status: 'waiting' })
      .loadRelationCountAndMap('team.userCount', 'team.users')
      .getMany();
  }

  async createTeam(name: string, leaderId: number): Promise<Team> {
    const leader = await this.userRepository.findOne({
      where: { id: leaderId },
    });
    if (!leader) {
      throw new NotFoundException('해당 유저가 없습니다.');
    }

    const existing = await this.teamRepository.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestException('이미 존재하는 게임방 이름입니다.');
    }

    const bgList = ['gameBg1', 'gameBg2', 'gameBg3', 'gameBg4'];
    const randomBg = bgList[Math.floor(Math.random() * bgList.length)];

    const newTeam = this.teamRepository.create({
      name,
      leader,
      backgroundImage: randomBg,
    });
    const savedTeam = await this.teamRepository.save(newTeam);

    leader.team = savedTeam;
    await this.userRepository.save(leader);

    try {
      this.waitingRoomGateway.notifyTeamCreated(savedTeam);
      console.log(`팀 생성 소켓 성공`);
    } catch (error) {
      console.error(`팀 생성 소켓 실패:`, error);
    }
    return savedTeam;
  }

  async getTeamUsers(
    teamId: number,
  ): Promise<{ userTeam: GetTeamDto[]; backgroundImage: string }> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['users', 'leader', 'users.character'],
    });

    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    return {
      userTeam: team.users.map((user) => ({
        id: user.id,
        name: user.name,
        characterId: user.characterId,
        isLeader: user.id === team.leader.id,
        isReady: false,
        character: user.character?.image ?? '',
      })),
      backgroundImage: team.backgroundImage ?? '',
    };
  }

  async getRankingByTeam(teamId: number): Promise<any[]> {
    const results = await this.gameRankingRepository.find({
      where: {
        team: {
          id: teamId,
        },
      },
      order: {
        score: 'DESC',
      },
      relations: ['user'],
    });

    return results.map((result) => ({
      id: result.id,
      score: result.score,
      createdAt: result.createdAt,
      user: {
        name: result.user.name,
      },
    }));
  }

  async exitTeam(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.teamId) {
      const teamId = user.teamId;
      const team = await this.teamRepository.findOne({
        where: user.teamId !== null ? { id: user.teamId } : {},
      });

      if (team && team.leaderId !== userId) {
        try {
          this.waitingRoomGateway.notifyUserLeft(teamId, userId);
          console.log(`사용자 퇴장 소켓 성공`);

          await new Promise(resolve => setTimeout(resolve, 100));   // 소켓 전송 시간 

        } catch (error) {
          console.error(`사용자 퇴장 소켓 실패:`, error);
        }
      }

      else if (team && team.leaderId === userId) {
        try {
          this.waitingRoomGateway.notifyUserLeft(teamId, userId);
          console.log(`리더 퇴장 소켓 성공`);
          await new Promise(resolve => setTimeout(resolve, 200));
          await this.teamRepository.remove(team);

          this.waitingRoomGateway.notifyTeamDeleted(teamId);
          console.log(`팀 삭제 소켓 성공`);

        } catch (error) {
          console.error(`팀 삭제 소켓 실패:`, error);
        }
      }
    }
    user.teamId = null;
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }
}