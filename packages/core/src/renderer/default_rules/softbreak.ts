import { RendererFn } from "../renderer";

export const softbreak: RendererFn = (_tokens, _idx, options) =>
  options.breaks ? (options.xhtmlOut ? "<br />\n" : "<br>\n") : "\n";
