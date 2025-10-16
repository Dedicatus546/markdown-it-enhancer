import { escapeHtml } from "../../common/utils";
import { RendererFn } from "../renderer";

export const code_inline: RendererFn = (
  tokens,
  idx,
  _options,
  _env,
  renderer,
) => {
  const token = tokens[idx];

  return (
    "<code"
    + renderer.renderAttrs(token)
    + ">"
    + escapeHtml(token.content)
    + "</code>"
  );
};
