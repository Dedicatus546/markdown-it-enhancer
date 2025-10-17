import type { MarkdownItPlugin, RendererFn } from "@markdown-it-enhancer/core";

import { normalizeOptions } from "./normalize_opts";
import { emoji_html } from "./render";
import { emoji_replace } from "./replace";
import type { EmojiOptions } from "./types";

declare module "@markdown-it-enhancer/core" {
  export interface RendererExtendsRules {
    emoji: RendererFn
  }
}

export const emoji: MarkdownItPlugin<[options?: EmojiOptions]> = (
  md,
  options,
) => {
  const opts = normalizeOptions(options);

  md.renderer.rules.emoji = emoji_html;

  md.core.ruler.after("linkify", "emoji", emoji_replace(md, opts));
};
