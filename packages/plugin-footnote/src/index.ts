import type { MarkdownItPlugin, RendererFn, Token } from "markdown-it-enhancer";

import {
  footnote_def,
  footnote_inline,
  footnote_ref,
  footnote_tail,
} from "./parse_rules";
import {
  footnote_anchor,
  footnote_anchor_name,
  footnote_block_close,
  footnote_block_open,
  footnote_caption,
  footnote_close,
  footnote_open,
  footnote_ref as footnote_ref_render,
} from "./render_rules";

declare module "markdown-it-enhancer" {
  export interface MarkdownItEnv {
    footnotes?: {
      refs?: Record<string, number>
      list?: Array<{
        label?: string
        count?: number
        content?: string
        tokens?: Array<Token>
      }>
    }
    docId?: string
  }

  export interface TokenMeta {
    id?: number
    subId?: number
    label?: string
  }

  export interface RendererExtendsRules {
    footnote_anchor_name: RendererFn
    footnote_caption: RendererFn
    footnote_ref: RendererFn
    footnote_block_open: RendererFn
    footnote_block_close: RendererFn
    footnote_open: RendererFn
    footnote_close: RendererFn
    footnote_anchor: RendererFn
  }
}

export const footnote: MarkdownItPlugin = (md) => {
  md.renderer.rules.footnote_ref = footnote_ref_render;
  md.renderer.rules.footnote_block_open = footnote_block_open;
  md.renderer.rules.footnote_block_close = footnote_block_close;
  md.renderer.rules.footnote_open = footnote_open;
  md.renderer.rules.footnote_close = footnote_close;
  md.renderer.rules.footnote_anchor = footnote_anchor;

  // helpers (only used in other rules, no tokens are attached to those)
  md.renderer.rules.footnote_caption = footnote_caption;
  md.renderer.rules.footnote_anchor_name = footnote_anchor_name;

  md.block.ruler.before("reference", "footnote_def", footnote_def, {
    alt: ["paragraph", "reference"],
  });
  md.inline.ruler.after("image", "footnote_inline", footnote_inline);
  md.inline.ruler.after("footnote_inline", "footnote_ref", footnote_ref);
  md.core.ruler.after("inline", "footnote_tail", footnote_tail);
};
