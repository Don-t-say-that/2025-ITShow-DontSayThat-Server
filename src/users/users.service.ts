import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException } from '@nestjs/common';
import { Character } from './entities/character.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,

    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { name, password } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { name } });

    if (existingUser) {
      const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
      if (!isPasswordCorrect) {
        throw new BadRequestException('중복된 사용자입니다. 새로운 닉네임을 입력해주세요.');
      }
      return existingUser;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      name,
      password: hashedPassword,
    });

    return this.userRepository.save(newUser);
  }

  async joinTeam(userId: number, teamId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['character'],
    });
    const team = await this.teamRepository.findOne({ where: { id: teamId } });

    if (!user || !team) {
      throw new NotFoundException('사용자 또는 팀이 존재하지 않습니다.');
    }

    user.team = team;
    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  async getFullUserData(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['character', 'team'],
    });

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없음`);
    }

    const isLeader = user.team?.leaderId === user.id;

    return {
      id: user.id,
      name: user.name,
      characterId: user.character?.id || 0,
      character: user.character?.image || '',
      isLeader,
      isReady: false,
    };
  }

  async randomCharacterToUser(userId: number) {
    try {
      return this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: userId },
        });
        if (!user) throw new NotFoundException('존재하지 않는 사용자 입니다.');

        // user가 속한 team의 캐릭터 불러오기
        const teamUsers = await manager.find(User, {
          where: user.teamId !== null ? { teamId: user.teamId } : {},
          relations: ['character'],
        });

        // 이미 사용된 캐릭터 id 제외
        const usedCharacterIds = teamUsers
          .map((t) => t.characterId)
          .filter((id): id is number => !!id);

        // 안 사용된 캐릭터 id 목록 구하기
        const availableCharacters = await manager.find(Character, {
          where: usedCharacterIds.length
            ? { id: Not(In(usedCharacterIds)) }
            : {},
        });

        if (availableCharacters.length === 0)
          throw new BadRequestException('이미 모든 캐릭터가 배정되었습니다.');

        // 랜덤 캐릭터 index 구하기
        const randomIndex = Math.floor(
          Math.random() * availableCharacters.length,
        );
        const randomCharacter = availableCharacters[randomIndex];

        if (!randomCharacter) {
          throw new NotFoundException('랜덤 캐릭터가 존재하지 않습니다.');
        }

        user.character = randomCharacter;
        return await manager.save(user);
      });
    } catch (e) {
      console.error('randomCharacterToUser error:', e);
      throw e;
    }
  }
}
