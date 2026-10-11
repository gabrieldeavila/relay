/** How a value reads inside text: objects as JSON, nothing for null. */
export function stringifyValue(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return value.toString();
    case 'object':
      return value === null ? '' : JSON.stringify(value);
    default:
      return '';
  }
}
