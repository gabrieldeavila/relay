import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { PublishWorkflow } from '../domain/publish-workflow.js';
import { StartDraftTest } from '../domain/start-draft-test.js';
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
    private readonly startDraftTest: StartDraftTest,
  ) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() body: unknown) {
    return this.repository.create(
      userId,
      parseBody(createWorkflowBody, body).name,
    );
  }

  @Get()
  list(@CurrentUser() userId: string) {
    return this.repository.list(userId);
  }

  @Get(':id')
  async get(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return orNotFound(await this.repository.find(id, userId));
  }

  /** Saves the draft; running versions are untouched until the next publish. */
  @Patch(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const changes = parseBody(updateWorkflowBody, body);
    return orNotFound(await this.repository.update(id, userId, changes));
  }

  @Post(':id/publish')
  async publish(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.publishWorkflow.execute(id, userId);
    if (result.type === 'not_found') throw workflowNotFound();
    if (result.type === 'invalid') {
      throw new UnprocessableEntityException({ issues: result.issues });
    }
    return { version: result.version };
  }

  /** Runs the saved draft without publishing it; the body is the trigger payload. */
  @Post(':id/test-runs')
  @HttpCode(202)
  async testDraft(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: unknown,
  ) {
    const result = await this.startDraftTest.execute(id, userId, payload ?? {});
    if (result.type === 'not_found') throw workflowNotFound();
    if (result.type === 'invalid') {
      throw new UnprocessableEntityException({ issues: result.issues });
    }
    return { id: result.runId };
  }
}

function orNotFound<T>(value: T | null): T {
  if (value === null) throw workflowNotFound();
  return value;
}

function workflowNotFound() {
  return new NotFoundException('Workflow not found');
}
