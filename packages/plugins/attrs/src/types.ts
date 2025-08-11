import type { Token, TokenAttr, TokenNesting } from "markdown-it-enhancer";

export interface AttributeOptions {
  leftDelimiter?: string
  rightDelimiter?: string
  allowedAttributes?: Array<string | RegExp>
}

export type AttributeNormalizedOptions = Required<AttributeOptions>;

export type PatternsResultDetectingStrRule = (str: string) => boolean;

export interface PatternsResultDetectingRule {
  shift?: number
  position?: number
  type?: string | PatternsResultDetectingStrRule
  tag?: string | PatternsResultDetectingStrRule
  children?:
    | Array<PatternsResultDetectingRule>
    | ((array: Array<unknown>) => boolean)
  content?: string | PatternsResultDetectingStrRule
  markup?: string | PatternsResultDetectingStrRule
  info?: string | PatternsResultDetectingStrRule
  nesting?: TokenNesting
  level?: number
  block?: boolean
  hidden?: boolean
  attrs?: Array<TokenAttr>
  map?: [number, number]
  meta?: unknown
}

export type PatternsResult = Array<{
  name: string
  tests: Array<PatternsResultDetectingRule>
  transform: (tokens: Array<Token>, i: number, j: number) => void
}>;
