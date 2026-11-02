import type { FontStore } from '../../images/data/font-store.js';
import { isFontInstalled } from '../../images/data/font-store.js';
import { installFont } from '../../images/data/install-font.js';
import type { FontNeed } from '../domain/design-template.js';

/**
 * Downloads the template's fonts that aren't installed yet. Best effort: a
 * font that can't be downloaded (offline) falls back to the next one in the
 * CSS list, so the families that failed are returned instead of thrown.
 */
export async function ensureDesignFonts(
  fonts: FontStore,
  needs: FontNeed[],
): Promise<string[]> {
  const missing = needs.filter((need) => !isFontInstalled(need.family));
  const results = await Promise.allSettled(
    missing.map((need) => installFont(fonts, need)),
  );
  return missing
    .filter((_, i) => results[i].status === 'rejected')
    .map((need) => need.family);
}
