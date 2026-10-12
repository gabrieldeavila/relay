/** Supabase Auth error codes we explain in plain words; others get a generic message. */
const KNOWN = new Set([
  "invalid_credentials",
  "user_already_exists",
  "weak_password",
  "email_address_invalid",
  "validation_failed",
]);

export function authErrorKey(code: string | undefined): string {
  return code && KNOWN.has(code) ? `errors.${code}` : "errors.unknown";
}
