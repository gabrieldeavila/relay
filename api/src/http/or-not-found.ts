import { NotFoundException } from '@nestjs/common';

/** A lookup by id from a URL: when it fails, the answer is a 404 with the reason. */
export async function orNotFound<T>(lookup: Promise<T>): Promise<T> {
  try {
    return await lookup;
  } catch (error) {
    throw new NotFoundException((error as Error).message);
  }
}
