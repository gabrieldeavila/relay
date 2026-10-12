/**
 * Splits a command typed on one line (`npx -y "@scope/server" ~/My Files`)
 * into the program and its arguments, the way a shell would for plain words
 * and quotes. Nothing is expanded or run by a shell: variables and `;` stay
 * literal text.
 */
export function splitCommandLine(
  line: string,
): { command: string; args: string[] } | null {
  const parts = tokenize(line);
  if (!parts || parts.length === 0) return null;
  const [command, ...args] = parts;
  return { command, args };
}

function tokenize(line: string): string[] | null {
  const parts: string[] = [];
  let current = '';
  let started = false;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quote) {
      if (char === quote) quote = null;
      else if (char === '\\' && quote === '"' && i + 1 < line.length) {
        current += line[++i];
      } else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) parts.push(current);
      current = '';
      started = false;
    } else {
      current += char;
      started = true;
    }
  }
  if (quote) return null;
  if (started) parts.push(current);
  return parts;
}
