import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { RunCanceller } from '../data/run-canceller.js';
import { RunReader } from '../data/run-reader.js';
import { RunStarter } from '../data/run-starter.js';

@Controller()
export class RunsController {
  constructor(
    private readonly starter: RunStarter,
    private readonly canceller: RunCanceller,
    private readonly reader: RunReader,
  ) {}

  /** Starts the latest published version; the body is the trigger payload. */
  @Post('workflows/:id/runs')
  @HttpCode(202)
  async start(
    @Param('id', ParseUUIDPipe) workflowId: string,
    @Body() payload: unknown,
  ) {
    const runId = await this.starter.startRun(workflowId, payload ?? {});
    if (!runId) {
      throw new NotFoundException('Publish the workflow before running it');
    }
    return { id: runId };
  }

  @Get('workflows/:id/runs')
  list(@Param('id', ParseUUIDPipe) workflowId: string) {
    return this.reader.listForWorkflow(workflowId);
  }

  @Get('runs/:id')
  async get(@Param('id', ParseUUIDPipe) runId: string) {
    const run = await this.reader.get(runId);
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  @Post('runs/:id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) runId: string) {
    const cancelled = await this.canceller.cancelRun(runId);
    if (!cancelled) throw new NotFoundException('No active run with this id');
    return { cancelled };
  }
}
