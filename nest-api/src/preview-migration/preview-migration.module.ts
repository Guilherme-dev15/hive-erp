import { Module } from '@nestjs/common';
import { PreviewFixtureController } from './preview-fixture.controller';
import { PreviewFixtureGuard } from './preview-fixture.guard';
import { PreviewFixtureService } from './preview-fixture.service';
import { PreviewMigrationController } from './preview-migration.controller';
import { PreviewMigrationGuard } from './preview-migration.guard';
import { PreviewMigrationService } from './preview-migration.service';

@Module({
  controllers: [PreviewMigrationController, PreviewFixtureController],
  providers: [
    PreviewMigrationGuard,
    PreviewMigrationService,
    PreviewFixtureGuard,
    PreviewFixtureService,
  ],
})
export class PreviewMigrationModule {}
