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
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { Public } from '../../auth/delivery/public.decorator.js';
import { RunStarter } from '../../engine/data/run-starter.js';
import { folderPath, listFolder } from '../data/list-folder.js';
import { TriggerReader } from '../data/trigger-reader.js';

@Controller()
export class TriggersController {
  constructor(
    private readonly reader: TriggerReader,
    private readonly starter: RunStarter,
  ) {}

  /**
   * How the published workflow starts: its webhook URL, next scheduled fire,
   * or the watched folder (and whether it exists, since a typo never fires).
   */
  @Get('workflows/:id/trigger')
  async describe(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) workflowId: string,
  ) {
    const trigger = await this.reader.forWorkflow(workflowId, userId);
    if (!trigger) return { kind: 'manual' };
    switch (trigger.kind) {
      case 'webhook':
        return {
          kind: 'webhook',
          url: `${publicUrl()}/hooks/${trigger.token}`,
        };
      case 'folder': {
        const folder = folderPath(trigger.watch?.folder ?? '');
        return {
          kind: 'folder',
          folder,
          pattern: trigger.watch?.pattern ?? '*',
          exists: (await listFolder(folder)) !== null,
        };
      }
      case 'schedule':
        return {
          kind: 'schedule',
          schedule: trigger.schedule,
          nextFireAt: trigger.nextFireAt,
          lastFiredAt: trigger.lastFiredAt,
        };
    }
  }

  /** A workflow's secret webhook; body and query become the trigger output. */
  @Public()
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
