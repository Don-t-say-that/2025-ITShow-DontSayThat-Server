import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { RoomService } from '../room/room.service';
import { Team } from './entities/team.entity';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly roomService: RoomService,
  ) {}

  @Post()
  async createTeam(
    @Body() body: { name: string; leaderId: number },
  ): Promise<Team> {
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

  @Patch(':userId/users')
  async exitTeam(@Param('userId') userId: number) {
    return this.teamsService.exitTeam(Number(userId));
  }

  @Post(':teamId/forbidden-words')
  async addForbiddenWord(
    @Param('teamId') teamId: number,
    @Body() body: { word: string; userId: number },
  ) {
    return this.roomService.createForbiddenWord(teamId, body.userId, body.word);
  }

  @Patch(':teamId/finish')
  async gameFinished( @Param('teamId') teamId : number) {
    return this.teamsService.gameFinished(Number(teamId));
  }

  @Get(':teamId/ranking')
  async getRankingByTeam(@Param('teamId') teamId: number) {
    return this.teamsService.getRankingByTeam(Number(teamId));
  }
}
