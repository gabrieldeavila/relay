/** Sent to MCP clients on connect so the model knows how Relay thinks. */
export const SERVER_INSTRUCTIONS = `Relay is a studio on the user's computer with two editors: Images (layers, like a small Photoshop) and Videos (a timeline, like a small CapCut).

Files
- Photos, videos and audio become assets (import_media, or pass a path/url to any tool that takes a file). Originals are never changed. list_assets finds them again.
- export_image turns an image into an image asset; add_clip puts it in a video (a cover, a logo, a title card). export_video makes an mp4 asset.

Images (imageId from create_image, open_image or list_images)
- Coordinates are canvas pixels, origin top-left. get_document shows size, layers (bottom to top) and where each layer's content is.
- Put separate elements on separate layers. Drawing tools target the active layer unless you pass layerId; add_layer makes its new layer active.
- Prefer batch_image for groups of edits: all-or-nothing, one undo step.
- Plan text with measure_text; for headlines use draw_text with a box and fit:"shrink". load_font a Google Fonts face for display text.
- Call render_image to see the result after each batch (grid=true for coordinates, region to zoom in).
- For photos: keep the Photo layer intact and build on top (duplicates, adjustment layers, masks).

Videos (videoId from create_video or list_videos)
- Times are seconds on the timeline. Clips sit on layers: 0 is the main track, higher layers draw on top; audio from all layers is mixed.
- add_clip appends after the last clip on its layer unless you give start. Trim video with in/out (seconds of the source). Images last \`duration\` seconds.
- add_text adds titles and captions (layer 10 by default, lower third unless you give a box). Same fonts as images.
- get_video lists every clip with start/end. update_clip moves, trims and restyles; split_clip + delete_clip cut out parts (closeGap to ripple).
- Prefer batch_video for several edits at once. Check your work with preview_frame (one moment) and preview_strip (the whole video at a glance).
- export_video only when the person asks or approves; then poll get_export.

The person may be watching both editors in the Relay app while you work.`;
