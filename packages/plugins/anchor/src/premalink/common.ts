import { PermalinkNormalizedBaseOptions } from "../types";

export const position = {
  false: "push",
  true: "unshift",
  after: "push",
  before: "unshift",
} as const;

export const permalinkSymbolMeta = {
  isPermalinkSymbol: true,
};

export const renderHref = (slug: string) => {
  return `#${slug}`;
};

export const renderAttrs = () => {
  return {};
};

export const permalinkDefaultOptions: PermalinkNormalizedBaseOptions = {
  class: "header-anchor",
  symbol: "#",
  renderHref,
  renderAttrs,
};
