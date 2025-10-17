import { RendererFn } from "@markdown-it-enhancer/core";

type Arrayable<T> = Array<T> | T;

export type LinkAttributesListItem = {
  attrs?: Record<string, string>
  matcher?(href: string, config: LinkAttributesListItem): boolean
  [key: string]: unknown
};

export type LinkAttributesOptions = Arrayable<LinkAttributesListItem>;

export type LinkAttributesNormalizedOptions = Array<LinkAttributesListItem>;

declare module "@markdown-it-enhancer/core" {
  interface RendererExtendsRules {
    link_open?: RendererFn
  }
}
