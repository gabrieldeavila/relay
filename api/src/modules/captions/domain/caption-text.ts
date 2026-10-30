/** New text in the caption's case: all-caps captions stay all caps. */
export function matchCaptionCase(original: string, text: string): string {
  const shouting =
    /\p{L}/u.test(original) && original === original.toLocaleUpperCase();
  return shouting ? text.toLocaleUpperCase() : text;
}

/**
 * Replaces `find` in `text`, ignoring case. With wholeWord, only where it isn't
 * part of a longer word ("ana" doesn't touch "banana").
 */
export function replaceInCaption(
  text: string,
  find: string,
  replacement: string,
  wholeWord: boolean,
): string {
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = wholeWord
    ? `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`
    : escaped;
  return text.replace(new RegExp(pattern, 'giu'), () => replacement);
}
