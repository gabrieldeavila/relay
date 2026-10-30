import type { ClipChanges } from '../../videos/domain/video-command-types.js';
import type { TextClip } from '../../videos/domain/timeline-types.js';
import type { TextTemplate } from './text-template.js';
import { templateText, templateTextStyle } from './template-text-style.js';

/** update_clip changes giving a text clip a template's look; its size and layout stay. */
export function restyleWithTemplate(
  clip: TextClip,
  template: TextTemplate,
): ClipChanges {
  const changes: ClipChanges = {
    style: templateTextStyle(template, clip.style.size),
  };
  const text = templateText(template, clip.text);
  if (text !== clip.text) changes.text = text;
  return changes;
}
