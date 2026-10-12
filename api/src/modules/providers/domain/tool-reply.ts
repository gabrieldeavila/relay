/** What a tool call answers, whichever way the app is reached. */
export interface ToolReply {
  text?: string;
  data?: unknown;
  /** Base64 image, e.g. from Pincel's render_image. */
  image?: string;
  /** PNG when the app does not say. */
  imageMimeType?: string;
}
