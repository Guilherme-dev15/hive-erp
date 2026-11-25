import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PreviewMigrationBatchDto } from './dto/preview-migration.dto';
import { PreviewMigrationGuard } from './preview-migration.guard';
import { PreviewMigrationService } from './preview-migration.service';

@Controller('api/internal/preview-migration')
@UseGuards(PreviewMigrationGuard)
export class PreviewMigrationController {
  constructor(private readonly service: PreviewMigrationService) {}

  @Post('import')
  import(@Body() batch: PreviewMigrationBatchDto) {
    return this.service.importBatch(batch);
  }
}
