import { Injectable } from '@nestjs/common';
import { ForbiddenWord } from './entity/room.entity';
import { Team } from 'src/teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(ForbiddenWord)
    private forbiddenWordRepository: Repository<ForbiddenWord>,

    @InjectRepository(Team)
    private teamRepository: Repository<Team>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createForbiddenWord(teamId: number, userId: number, word: string) {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!team || !user) throw new Error('팀 또는 유저를 찾을 수 없습니다.');

    const forbidden = this.forbiddenWordRepository.create({ team, user, word });
    return this.forbiddenWordRepository.save(forbidden);
  }
}
