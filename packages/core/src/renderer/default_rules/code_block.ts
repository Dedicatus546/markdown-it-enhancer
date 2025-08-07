import { escapeHtml } from "../../common/utils";
import { RendererFn } from "../renderer";

export const code_block: RendererFn<"sync"> = (
  tokens,
  idx,
  _options,
  _env,
  renderer,
) => {
  const token = tokens[idx];

  return (
    "<pre" +
    renderer.renderAttrs(token) +
    "><code>" +
    escapeHtml(tokens[idx].content) +
    "</code></pre>\n"
  );
};
