import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
  type MessageEvent,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { RunCanceller } from '../data/run-canceller.js';
import { RunReader } from '../data/run-reader.js';
import { RunRetrier } from '../data/run-retrier.js';
import { RunStream } from '../data/run-stream.js';
import { RunStarter } from '../data/run-starter.js';

@Controller()
export class RunsController {
  constructor(
    private readonly starter: RunStarter,
    private readonly canceller: RunCanceller,
    private readonly retrier: RunRetrier,
    private readonly runStream: RunStream,
    private readonly reader: RunReader,
  ) {}

  /** Starts the latest published version; the body is the trigger payload. */
  @Post('workflows/:id/runs')
  @HttpCode(202)
  async start(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) workflowId: string,
    @Body() payload: unknown,
  ) {
    if (!(await this.reader.ownsWorkflow(workflowId, userId))) {
      throw new NotFoundException('Workflow not found');
    }
    const runId = await this.starter.startRun(workflowId, payload ?? {});
    if (!runId) {
      throw new NotFoundException('Publish the workflow before running it');
    }
    return { id: runId };
  }

  @Get('workflows/:id/runs')
  list(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) workflowId: string,
  ) {
    return this.reader.listForWorkflow(workflowId, userId);
  }

  @Get('runs/:id')
  async get(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) runId: string,
  ) {
    const run = await this.reader.get(runId, userId);
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  @Post('runs/:id/cancel')
  async cancel(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) runId: string,
  ) {
    if (!(await this.reader.get(runId, userId))) {
      throw new NotFoundException('Run not found');
    }
    const cancelled = await this.canceller.cancelRun(runId);
    if (!cancelled) throw new NotFoundException('No active run with this id');
    return { cancelled };
  }

  /** Tries the steps that failed the run again, keeping everything else. */
  @Post('runs/:id/retry')
  async retry(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) runId: string,
  ) {
    if (!(await this.reader.get(runId, userId))) {
      throw new NotFoundException('Run not found');
    }
    if (!(await this.retrier.retry(runId))) {
      throw new ConflictException('Only a failed run can be retried');
    }
    return { retried: true };
  }

  /** Server-sent events: `run` with the full run on every change, `ping` to stay open. */
  @Sse('runs/:id/events')
  async events(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) runId: string,
  ): Promise<Observable<MessageEvent>> {
    if (!(await this.reader.get(runId, userId))) {
      throw new NotFoundException('Run not found');
    }
    return this.runStream.stream(runId, userId);
  }
}
