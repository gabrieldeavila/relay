import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PublishWorkflow } from '../domain/publish-workflow.js';
import type { WorkflowRepository } from '../domain/workflow.js';
import {
  createWorkflowBody,
  parseBody,
  updateWorkflowBody,
} from './workflow-bodies.js';

export const WORKFLOW_REPOSITORY = 'WORKFLOW_REPOSITORY';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: WorkflowRepository,
    private readonly publishWorkflow: PublishWorkflow,
  ) {}

  @Post()
  create(@Body() body: unknown) {
    return this.repository.create(parseBody(createWorkflowBody, body).name);
  }

  @Get()
  list() {
    return this.repository.list();
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return orNotFound(await this.repository.find(id));
  }

  /** Saves the draft; running versions are untouched until the next publish. */
  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const changes = parseBody(updateWorkflowBody, body);
    return orNotFound(await this.repository.update(id, changes));
  }

  @Post(':id/publish')
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.publishWorkflow.execute(id);
    if (result.type === 'not_found') throw workflowNotFound();
    if (result.type === 'invalid') {
      throw new UnprocessableEntityException({ issues: result.issues });
    }
    return { version: result.version };
  }
}

function orNotFound<T>(value: T | null): T {
  if (value === null) throw workflowNotFound();
  return value;
}

function workflowNotFound() {
  return new NotFoundException('Workflow not found');
}
