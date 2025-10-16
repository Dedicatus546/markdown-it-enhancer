import { RendererFn } from "../renderer";

export const image: RendererFn = (
  tokens,
  idx,
  options,
  env,
  renderer,
) => {
  const token = tokens[idx];

  // "alt" attr MUST be set, even if empty. Because it's mandatory and
  // should be placed on proper position for tests.
  //
  // Replace content with actual value

  if (token.attrs) {
    token.attrs[token.attrIndex("alt")][1] = renderer.renderInlineAsText(
      token.children,
      options,
      env,
    );
  }

  return renderer.renderToken(tokens, idx, options);
};
