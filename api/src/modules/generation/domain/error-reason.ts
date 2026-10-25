/** The human message in a provider's error body, whatever shape it uses. */
export function errorReason(body: unknown, status: number): string {
  const b = (body ?? {}) as Record<string, unknown>;
  const error = b.error as Record<string, unknown> | string | undefined;
  const detail = b.detail;
  const candidates = [
    typeof error === 'object' ? error?.message : error,
    typeof detail === 'string' ? detail : undefined,
    Array.isArray(detail)
      ? (detail[0] as { msg?: string } | undefined)?.msg
      : undefined,
    b.message,
    b.title,
  ];
  const found = candidates.find(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
  return found ?? `HTTP ${status}`;
}
