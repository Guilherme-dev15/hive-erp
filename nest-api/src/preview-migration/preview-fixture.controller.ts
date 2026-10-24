import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PreviewFixtureRequestDto } from './preview-fixture.dto';
import { PreviewFixtureGuard } from './preview-fixture.guard';
import { PreviewFixtureService } from './preview-fixture.service';

@Controller('api/internal/preview-fixture')
@UseGuards(PreviewFixtureGuard)
export class PreviewFixtureController {
  constructor(private readonly service: PreviewFixtureService) {}

  @Post()
  run(@Body() request: PreviewFixtureRequestDto) {
    return this.service.run(request.action);
  }
}
