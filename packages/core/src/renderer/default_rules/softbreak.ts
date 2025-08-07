import { RendererFn } from "../renderer";

export const softbreak: RendererFn<"sync"> = (_tokens, _idx, options) =>
  options.breaks ? (options.xhtmlOut ? "<br />\n" : "<br>\n") : "\n";
