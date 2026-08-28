import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TeamService } from './team.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v2/team')
@UseGuards(AuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getMembers(@Request() req: any) {
    return this.teamService.getMembers(req.user.id);
  }

  @Post()
  inviteMember(@Body() inviteDto: InviteMemberDto, @Request() req: any) {
    return this.teamService.inviteMember(inviteDto, req.user.id);
  }

  @Delete(':email')
  removeMember(@Param('email') email: string, @Request() req: any) {
    return this.teamService.removeMember(email, req.user.id);
  }
}
