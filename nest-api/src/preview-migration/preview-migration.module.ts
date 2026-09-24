import { Module } from '@nestjs/common';
import { PreviewMigrationController } from './preview-migration.controller';
import { PreviewMigrationGuard } from './preview-migration.guard';
import { PreviewMigrationService } from './preview-migration.service';

@Module({
  controllers: [PreviewMigrationController],
  providers: [PreviewMigrationGuard, PreviewMigrationService],
})
export class PreviewMigrationModule {}
