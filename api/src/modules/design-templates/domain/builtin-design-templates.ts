import { CARDS_AND_POSTERS } from './builtin/cards-and-posters.js';
import { SOCIAL_POSTS } from './builtin/social-posts.js';
import { STORIES_AND_THUMBNAILS } from './builtin/stories-and-thumbnails.js';
import type { DesignTemplate } from './design-template.js';

export const BUILTIN_DESIGN_TEMPLATES: DesignTemplate[] = [
  ...SOCIAL_POSTS,
  ...STORIES_AND_THUMBNAILS,
  ...CARDS_AND_POSTERS,
];
