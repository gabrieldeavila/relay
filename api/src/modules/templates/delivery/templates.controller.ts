import {
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { ProviderRepository } from '../../providers/data/drizzle-provider.repository.js';
import { WORKFLOW_REPOSITORY } from '../../workflows/delivery/workflows.controller.js';
import { parseBody } from '../../workflows/delivery/workflow-bodies.js';
import type { WorkflowRepository } from '../../workflows/domain/workflow.js';
import { findTemplate, TEMPLATES } from '../domain/catalog/index.js';
import { describeTemplate } from '../domain/describe-template.js';
import {
  instantiateTemplate,
  type ConnectedApp,
} from '../domain/instantiate-template.js';

const useBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
});

/** Ready-made flows, and starting a workflow from one. */
@Controller('templates')
export class TemplatesController {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly workflows: WorkflowRepository,
    private readonly providers: ProviderRepository,
    private readonly accounts: AccountRepository,
  ) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    const [connected, accounts] = await Promise.all([
      this.connectedApps(userId),
      this.accounts.list(userId),
    ]);
    const kinds = accounts.map((account) => account.kind);
    return TEMPLATES.map((t) => describeTemplate(t, connected, kinds));
  }

  /** Creates a draft workflow from the template; the user fills the blanks and publishes. */
  @Post(':id/use')
  async use(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const template = findTemplate(id);
    if (!template) throw new NotFoundException('Template not found');
    const { name } = parseBody(useBody, body ?? {});
    const result = instantiateTemplate(
      template,
      await this.connectedApps(userId),
    );
    if (!result.ok) {
      const apps = result.missingApps.map((app) => app.name).join(', ');
      throw new ConflictException(`Connect ${apps} first (see Connections)`);
    }
    const workflow = await this.workflows.create(
      userId,
      name ?? template.title,
    );
    await this.workflows.update(workflow.id, userId, {
      draftGraph: result.graph,
    });
    return { id: workflow.id };
  }

  private async connectedApps(userId: string): Promise<ConnectedApp[]> {
    return (await this.providers.list(userId)).map((provider) => ({
      id: provider.id,
      name: provider.name,
      toolNames: provider.tools.map((tool) => tool.name),
    }));
  }
}
