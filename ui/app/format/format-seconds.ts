/** 75.5 → "1:15.5"; whole seconds drop the decimal ("0:03"). */
export function formatSeconds(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = Math.round((safe - minutes * 60) * 10) / 10;
  const [whole, tenth] = String(rest).split(".");
  return `${minutes}:${whole.padStart(2, "0")}${tenth ? `.${tenth}` : ""}`;
}
