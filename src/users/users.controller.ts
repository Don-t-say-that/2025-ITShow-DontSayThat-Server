import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
    return this.usersService.joinTeam(id, teamId);
  }

}

