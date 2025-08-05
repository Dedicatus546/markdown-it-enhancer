import type { MarkdownItPlugin } from "markdown-it-enhancer";

import { normalizeOptions } from "./normalize_opts";
import { emoji_html } from "./render";
import { emoji_replace } from "./replace";
import type { EmojiOptions } from "./types";

export const emoji: MarkdownItPlugin<[options?: EmojiOptions]> = (
  md,
  options,
) => {
  const opts = normalizeOptions(options);

  md.renderer.rules.emoji = emoji_html;

  md.core.ruler.after("linkify", "emoji", emoji_replace(md, opts));
};
