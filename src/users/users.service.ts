import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { name, password } = createUserDto;
    
    const existingUser = await this.userRepository.findOne({ where: { name } });

    if (existingUser) {
      throw new BadRequestException('중복된 사용자입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
      name,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async joinTeam (userId: number, teamId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const team = await this.teamRepository.findOne({ where: { id: teamId } });

    if (!user || !team) {
      throw new NotFoundException('사용자 또는 팀이 존재하지 않습니다.');
    }

    user.team = team;
    return this.userRepository.save(user);
  }

}
