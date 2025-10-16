import { MarkdownIt, RendererFn, Token } from "markdown-it-enhancer";

export type TableOfContentsOptions = {
  includeLevel?: Array<number>
  containerClass?: string
  slugify?(text: string, rawToken: Token): string
  markerPattern?: RegExp
  omitTag?: string
  listType?: "ul" | "ol"
  format?(content: string, md: MarkdownIt, anchor: string | null): Promise<string>
  containerHeaderHtml?: string
  containerFooterHtml?: string
  transformLink?(anchor: string | null): string
  transformContainerOpen?(containerClass: string | undefined, containerHeaderHtml: string | undefined): string
  transformContainerClose?(containerClass: string | undefined): string
  getTokensText?(tokens: Array<Token>, token: Token): string
};

export type TableOfContentsNormalizedOptions = Required<Omit<TableOfContentsOptions, "containerHeaderHtml" | "containerFooterHtml" | "transformLink">> & Pick<TableOfContentsOptions, "containerHeaderHtml" | "containerFooterHtml" | "transformLink">;

export interface HeadlineItem {
  level: number
  anchor: string | null
  text: string
  token: Token | null
}

export interface TocItem {
  level: number
  text: string
  anchor: string | null
  children: Array<TocItem>
  parent: TocItem | null
}

declare module "markdown-it-enhancer" {
  interface RendererExtendsRules {
    toc_open: RendererFn
    toc_close: RendererFn
    toc_body: RendererFn
  }
}
