import { IsIn } from 'class-validator';

export const PREVIEW_FIXTURE_NAME = 'tenant-isolation-v1' as const;
export const PREVIEW_FIXTURE_ACTIONS = ['seed', 'cleanup'] as const;

export type PreviewFixtureAction = (typeof PREVIEW_FIXTURE_ACTIONS)[number];

export class PreviewFixtureRequestDto {
  @IsIn([PREVIEW_FIXTURE_NAME])
  fixture!: typeof PREVIEW_FIXTURE_NAME;

  @IsIn(PREVIEW_FIXTURE_ACTIONS)
  action!: PreviewFixtureAction;
}
