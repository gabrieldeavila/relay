import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { publicUrl } from '../../../public-url.js';
import { RunStarter } from '../../engine/data/run-starter.js';
import { TriggerReader } from '../data/trigger-reader.js';

@Controller()
export class TriggersController {
  constructor(
    private readonly reader: TriggerReader,
    private readonly starter: RunStarter,
  ) {}

  /** How the published workflow starts: its webhook URL or next scheduled fire. */
  @Get('workflows/:id/trigger')
  async describe(@Param('id', ParseUUIDPipe) workflowId: string) {
    const trigger = await this.reader.forWorkflow(workflowId);
    if (!trigger) return { kind: 'manual' };
    return trigger.kind === 'webhook'
      ? { kind: 'webhook', url: `${publicUrl()}/hooks/${trigger.token}` }
      : {
          kind: 'schedule',
          schedule: trigger.schedule,
          nextFireAt: trigger.nextFireAt,
          lastFiredAt: trigger.lastFiredAt,
        };
  }

  /** A workflow's secret webhook; body and query become the trigger output. */
  @Post('hooks/:token')
  @HttpCode(202)
  async hook(
    @Param('token') token: string,
    @Body() body: unknown,
    @Query() query: Record<string, unknown>,
  ) {
    const trigger = await this.reader.webhookByToken(token);
    const runId =
      trigger &&
      (await this.starter.startRun(trigger.workflowId, {
        body: body ?? null,
        query,
      }));
    if (!runId) throw new NotFoundException('Unknown webhook');
    return { runId };
  }
}
