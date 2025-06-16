import { Controller, Post, Body, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { WaitingRoomGateway } from '../room/room.gateway';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly waitingRoomGateway: WaitingRoomGateway, 
  ) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id/team')
  async updateUserTeam(
    @Param('id') id: number,
    @Body('teamId') teamId: number,
  ) {
    console.log('팀 ID:', teamId);

    const savedUser = await this.usersService.joinTeam(id, teamId);

    const userData = {
      id: savedUser.id,
      name: savedUser.name,
      character: savedUser.character?.image || '',
      characterId: savedUser.character?.id || 0,
      isLeader: false,
      isReady: false,
    };

    try {
      this.waitingRoomGateway.notifyUserJoined(teamId, userData);
      console.log(`소켓 발생 성공`);
    } catch (error) {
      console.error(`소켓 발생 실패`, error);
    }

    return savedUser;
  }

  @Get(':id')
  async getFullUserData(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getFullUserData(id);
  }

  @Patch('/:id/random')
  async saveRandomCharacter(@Param('id') id: number) {
    return this.usersService.randomCharacterToUser(id);
  }
}
