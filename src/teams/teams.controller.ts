import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { RoomService } from '../room/room.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { Team } from './entities/team.entity';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService,
    private readonly roomService: RoomService
  ) { }


  @Post()
  async createTeam(@Body() body: { name: string; leaderId: number }): Promise<Team> {
    const { name, leaderId } = body;
    return this.teamsService.createTeam(name, leaderId);
  }

  @Get('waiting')
  async getWaitingTeams(): Promise<(Team & { userCount: number })[]> {
    return this.teamsService.getWaitingTeams();
  }

  @Get(':teamId/users')
  async getTeamUsers(@Param('teamId') teamId: number) {
    return this.teamsService.getTeamUsers(Number(teamId));
  }

  @Post(':teamId/forbidden-words')
  async addForbiddenWord(
    @Param('teamId') teamId: number,
    @Body() body: { word: string, userId: number }
  ) {
    return this.roomService.createForbiddenWord(teamId, body.userId, body.word);
  }
}
