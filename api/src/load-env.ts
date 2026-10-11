import { existsSync } from 'node:fs';

/** `.env.local` wins over `.env`; variables already set win over both. */
for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) process.loadEnvFile(file);
}
