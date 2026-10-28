import { z } from 'zod';
import { CAPTION_HIGHLIGHTS } from '../domain/caption-highlight.js';
import { CAPTION_POSITIONS, CAPTION_STYLES } from '../domain/caption-style.js';

export const languageField = z
  .string()
  .optional()
  .describe(
    'Spoken language code, e.g. "pt" or "en"; default from Relay\'s setup ("auto" detects it)',
  );

export const captionStyleField = z
  .enum(CAPTION_STYLES)
  .default('bold')
  .describe(
    'bold = white uppercase with a thick outline (CapCut look); yellow = same in yellow; boxed = white on a dark bar; clean = sentence case, thin outline',
  );

export const captionPositionField = z
  .enum(CAPTION_POSITIONS)
  .default('lower')
  .describe('Where captions sit in the frame');

export const captionHighlightField = z
  .enum(CAPTION_HIGHLIGHTS)
  .default('color')
  .describe(
    'How the word being said stands out: color = it turns highlightColor (default yellow; green on yellow text); box = white word on a highlightColor box (default green); none = whole captions only',
  );
