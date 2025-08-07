import { RendererFn } from "../renderer";

export const hardbreak: RendererFn<"sync"> = (_tokens, _idx, options) =>
  options.xhtmlOut ? "<br />\n" : "<br>\n";
