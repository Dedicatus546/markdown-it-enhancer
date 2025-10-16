import { RendererFn } from "../renderer";

export const hardbreak: RendererFn = (_tokens, _idx, options) =>
  options.xhtmlOut ? "<br />\n" : "<br>\n";
