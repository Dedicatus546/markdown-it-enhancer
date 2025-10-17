import type { StateCore, Token } from "@markdown-it-enhancer/core";

export type Placement = "after" | "before";

export interface MarkdownItAnchorOptions {
  level?: number | number[]
  slugify?(str: string): string
  slugifyWithState?: (str: string, state: StateCore) => string
  getTokensText?: (tokens: Token[]) => string
  uniqueSlugStartIndex?: number
  permalink?: PermalinkGenerator
  callback?: (token: Token, anchorInfo: AnchorInfo) => void
  tabIndex?: number | false
}

export type MarkdownItAnchorNormalizedOptions = Required<
  Pick<
    MarkdownItAnchorOptions,
    "level" | "slugify" | "uniqueSlugStartIndex" | "tabIndex" | "getTokensText"
  >
>
& MarkdownItAnchorOptions;

export type RenderHref = (slug: string, state: StateCore) => string;

export type RenderAttrs = (
  slug: string,
  state: StateCore,
) => Record<string, string | number>;

export interface PermalinkBaseOptions {
  class?: string
  symbol?: string
  renderHref?: RenderHref
  renderAttrs?: RenderAttrs
}

export type PermalinkNormalizedBaseOptions = Required<PermalinkBaseOptions>;

export interface LinkInsideHeaderPermalinkOptions extends PermalinkBaseOptions {
  space?: boolean | string
  placement?: Placement
  ariaHidden?: boolean
}

export type LinkInsideHeaderPermalinkNormalizedOptions
  = Required<LinkInsideHeaderPermalinkOptions>;

export interface AriaHiddenPermalinkOptions extends PermalinkBaseOptions {
  space?: boolean | string
  placement?: Placement
}

export type AriaHiddenPermalinkNormalizedOptions
  = Required<AriaHiddenPermalinkOptions>;

export interface HeaderLinkPermalinkOptions extends PermalinkBaseOptions {
  safariReaderFix?: boolean
}

export type HeaderLinkPermalinkNormalizedOptions
  = Required<HeaderLinkPermalinkOptions>;

export type LinkAfterHeaderPermalinkOptions = PermalinkBaseOptions & {
  space?: boolean | string
  placement?: Placement
  wrapper?: [string, string] | null
} & (
  | {
    style: "visually-hidden"
    assistiveText: (title: string) => string
    visuallyHiddenClass: string
  }
  | {
    style: "aria-label"
    assistiveText: (title: string) => string
  }
  | {
    style?: "aria-describedby" | "aria-labelledby"
  }
  );

export type LinkAfterHeaderPermalinkNormalizedOptions = Required<
  Pick<
    LinkAfterHeaderPermalinkOptions,
    "style" | "space" | "wrapper" | "placement" | keyof PermalinkBaseOptions
  >
>;

export type PermalinkOptions
  = | LinkInsideHeaderPermalinkOptions
    | AriaHiddenPermalinkOptions
    | HeaderLinkPermalinkOptions
    | LinkAfterHeaderPermalinkOptions;

export type PermalinkGenerator = (
  slug: string,
  opts: MarkdownItAnchorNormalizedOptions,
  state: StateCore,
  index: number,
) => void;

export interface AnchorInfo {
  slug: string
  title: string
}
