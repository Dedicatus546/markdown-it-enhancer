import { escapeHtml } from "@markdown-it-enhancer/shared";

import { RendererFn } from "../renderer";

export const text: RendererFn = (tokens, idx) =>
  escapeHtml(tokens[idx].content);
