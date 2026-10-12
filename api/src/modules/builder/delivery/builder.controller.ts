import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { isRetryable } from '../../engine/domain/step-error.js';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { parseBody } from '../../workflows/delivery/workflow-bodies.js';
import { DraftWorkflows } from '../data/draft-workflows.js';
import { FlowBuilder, NoAiAccount } from '../data/flow-builder.js';
import { withMessages } from '../domain/describe-issue.js';

const buildBody = z.object({
  description: z.string().trim().min(3).max(4000),
});

/** "Describe what you want": a draft workflow from a few sentences. */
@Controller('workflows')
export class BuilderController {
  constructor(
    private readonly builder: FlowBuilder,
    private readonly drafts: DraftWorkflows,
  ) {}

  /** Creates a draft (never publishes); the issues left are blanks to fill. */
  @Post('build')
  async build(@CurrentUser() userId: string, @Body() body: unknown) {
    const { description } = parseBody(buildBody, body);
    const result = await this.builder
      .draft(userId, description)
      .catch((error: unknown) => {
        throw toHttpError(error);
      });
    if (!result.ok) {
      throw new UnprocessableEntityException({
        message:
          'Claude could not draft a valid workflow; try saying it differently',
        problems: result.problems,
      });
    }
    const { id } = await this.drafts.create(userId, result.name, result.graph);
    return {
      id,
      name: result.name,
      summary: result.summary,
      issues: withMessages(result.issues),
    };
  }
}

/** A missing key or a refusal is the user's to fix (409/422); the rest is upstream (503). */
function toHttpError(error: unknown): unknown {
  if (error instanceof NoAiAccount) {
    return new HttpException(error.message, HttpStatus.CONFLICT);
  }
  if (!(error instanceof StepFailure)) return error;
  const { message } = error.error;
  if (!isRetryable(error.error)) {
    return new UnprocessableEntityException(message);
  }
  return new HttpException(message, HttpStatus.SERVICE_UNAVAILABLE);
}
