import type { MarkdownItPlugin } from "@markdown-it-enhancer/core";

import { emoji as emojiBare } from "./bare";
import emojies_defs from "./data/full";
import emojies_shortcuts from "./data/shortcuts";
import type { EmojiOptions } from "./types";

const defaultOptions = {
  defs: emojies_defs,
  shortcuts: emojies_shortcuts,
  enabled: [],
};

export const emoji: MarkdownItPlugin<[options?: EmojiOptions]> = (
  md,
  options,
) => {
  const opts = Object.assign({}, defaultOptions, options);
  emojiBare(md, opts);
};
