type Arrayable<T> = T | Array<T>;

export interface EmojiOptions {
  defs?: Record<string, string>
  shortcuts?: Record<string, Arrayable<string>>
  enabled?: Array<string>
}

export type EmojiNormalizedOptions = {
  defs: Record<string, string>
  shortcuts: Record<string, string>
  scanRE: RegExp
  replaceRE: RegExp
};
