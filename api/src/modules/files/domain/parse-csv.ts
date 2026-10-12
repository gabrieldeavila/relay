const DELIMITERS = [',', ';', '\t'] as const;

/**
 * CSV as exported by spreadsheets (RFC 4180): quoted fields may hold the
 * delimiter, line breaks and doubled quotes. The delimiter is guessed from the
 * first line, since Excel in many languages writes `;`.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const delimiter = guessDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) rows.push([...row, field]);
  return rows;
}

function guessDelimiter(text: string): string {
  const firstLine = firstRecord(text);
  const counts = DELIMITERS.map((d) => firstLine.split(d).length - 1);
  const best = Math.max(...counts);
  return best === 0 ? ',' : DELIMITERS[counts.indexOf(best)];
}

/** The first line, ignoring anything inside quotes. */
function firstRecord(text: string): string {
  let quoted = false;
  let out = '';
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === '\n' || char === '\r')) break;
    else if (!quoted) out += char;
  }
  return out;
}
