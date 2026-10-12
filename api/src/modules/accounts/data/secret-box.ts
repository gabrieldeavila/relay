import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCMTypes,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ALGORITHM: CipherGCMTypes = 'aes-256-gcm';
const VERSION = 'v1';

/**
 * Encrypts account secrets before they reach the database. The key comes from
 * RELAY_SECRET_KEY (base64, 32 bytes) or a file created on first use
 * (SECRET_KEY_FILE, default `.data/secret.key`), so it never sits next to the data.
 */
@Injectable()
export class SecretBox {
  private key?: Buffer;

  seal(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.secretKey(), iv);
    const sealed = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const parts = [iv, cipher.getAuthTag(), sealed].map((b) =>
      b.toString('base64'),
    );
    return [VERSION, ...parts].join(':');
  }

  open(sealed: string): string {
    const [version, iv, tag, data] = sealed.split(':');
    if (version !== VERSION || !iv || !tag || !data) {
      throw new Error('Unreadable secret');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.secretKey(),
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private secretKey(): Buffer {
    this.key ??= loadKey();
    return this.key;
  }
}

function loadKey(): Buffer {
  const fromEnv = process.env.RELAY_SECRET_KEY;
  if (fromEnv) return checkedKey(Buffer.from(fromEnv, 'base64'));

  const file = resolve(process.env.SECRET_KEY_FILE ?? '.data/secret.key');
  if (existsSync(file)) {
    return checkedKey(Buffer.from(readFileSync(file, 'utf8').trim(), 'base64'));
  }
  const key = randomBytes(32);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, key.toString('base64'), { mode: 0o600 });
  return key;
}

function checkedKey(key: Buffer): Buffer {
  if (key.length !== 32) throw new Error('The secret key must be 32 bytes');
  return key;
}
