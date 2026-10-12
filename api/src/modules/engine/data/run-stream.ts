import { Injectable, type MessageEvent } from '@nestjs/common';
import {
  auditTime,
  concatMap,
  distinctUntilChanged,
  filter,
  from,
  interval,
  map,
  merge,
  of,
  type Observable,
} from 'rxjs';
import { RunEvents } from './run-events.js';
import { RunReader } from './run-reader.js';

const PING_MS = 15_000;

/** Live run snapshots for the runs view: one now, then one per change. */
@Injectable()
export class RunStream {
  constructor(
    private readonly reader: RunReader,
    private readonly events: RunEvents,
  ) {}

  stream(runId: string, ownerId: string): Observable<MessageEvent> {
    const snapshots = merge(
      of(runId),
      this.events.changes(runId).pipe(auditTime(100)),
    ).pipe(
      concatMap(() => from(this.reader.get(runId, ownerId))),
      filter((run) => run !== null),
      map((run) => JSON.stringify(run)),
      distinctUntilChanged(),
      map((data): MessageEvent => ({ type: 'run', data })),
    );
    // Keeps idle connections (a run waiting for days) from being dropped.
    const pings = interval(PING_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: '' })),
    );
    return merge(snapshots, pings);
  }
}
