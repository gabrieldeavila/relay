import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { Public } from '../../auth/delivery/public.decorator.js';
import { EventResumer } from '../data/event-resumer.js';
import { answerPage, confirmPage, isSafeAction } from './confirm-page.js';
import { deliveryReply } from './delivery-reply.js';

/** Secret links that resume waiting steps: `/resume/:token/:nodeId[/:action]`. */
@Public()
@Controller('resume/:token/:nodeId')
export class ResumeController {
  constructor(private readonly resumer: EventResumer) {}

  /** From another app; send `Idempotency-Key` to make retries safe. */
  @Post()
  async event(
    @Param('token') token: string,
    @Param('nodeId') nodeId: string,
    @Body() payload: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res() res: Response,
  ) {
    const reply = deliveryReply(
      await this.resumer.deliver({
        resumeToken: token,
        nodeId,
        action: null,
        payload: payload ?? null,
        dedupeKey: idempotencyKey ?? randomUUID(),
      }),
    );
    res.status(reply.status).json({ message: reply.message });
  }

  @Get(':action')
  confirm(@Param('action') action: string, @Res() res: Response) {
    if (!isSafeAction(action)) throw new NotFoundException();
    res.type('html').send(confirmPage(action));
  }

  /** The confirm button; answering twice with the same action is a no-op. */
  @Post(':action')
  async answer(
    @Param('token') token: string,
    @Param('nodeId') nodeId: string,
    @Param('action') action: string,
    @Body() payload: unknown,
    @Res() res: Response,
  ) {
    if (!isSafeAction(action)) throw new NotFoundException();
    const reply = deliveryReply(
      await this.resumer.deliver({
        resumeToken: token,
        nodeId,
        action,
        payload: payload ?? null,
        dedupeKey: `link:${action}`,
      }),
    );
    res.status(reply.status).type('html').send(answerPage(reply.message));
  }
}
