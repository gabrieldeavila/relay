import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Response } from 'express';
import { DATABASE, type Database } from '../../../database/database.js';
import { runs, workflows } from '../../../database/schema/index.js';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { RunFileStore } from '../data/run-file-store.js';

/** A run's files, for the owner of the run's workflow only. */
@Controller('files')
export class FilesController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly store: RunFileStore,
  ) {}

  @Get(':runId/:name')
  async file(
    @CurrentUser() userId: string,
    @Param('runId') runId: string,
    @Param('name') name: string,
    @Res() res: Response,
  ) {
    const path = this.store.locate(runId, name);
    if (!path || !(await this.ownsRun(runId, userId))) {
      throw new NotFoundException('File not found');
    }
    // The default folder is `.data/`: send() refuses dot folders unless told.
    res.sendFile(path, { dotfiles: 'allow' });
  }

  private async ownsRun(runId: string, ownerId: string) {
    const [row] = await this.db
      .select({ id: runs.id })
      .from(runs)
      .innerJoin(workflows, eq(workflows.id, runs.workflowId))
      .where(and(eq(runs.id, runId), eq(workflows.ownerId, ownerId)));
    return Boolean(row);
  }
}
