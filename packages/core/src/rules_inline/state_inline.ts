// Inline parser state

import { isMdAsciiPunct, isPunctChar, isWhiteSpace } from "../common/utils";
import { type MarkdownIt, MarkdownItEnv } from "../index";
import Token, { TokenNesting, type TokenNestingType } from "../token";

export interface Delimiter {
  // Char code of the starting marker (number).
  //
  marker: number;

  // Total length of these series of delimiters.
  //
  length: number;

  // A position of the token this delimiter corresponds to.
  //
  token: number;

  // If this delimiter is matched as a valid opener, `end` will be
  // equal to its position, otherwise it's `-1`.
  //
  end: number;

  // Boolean flags that determine if this delimiter could open or close
  // an emphasis.
  //
  open: boolean;
  close: boolean;
}

interface StateInline {
  Token: typeof Token;
}

export type TokenMeta = { delimiters: Array<Delimiter> } | null;

class StateInline {
  src: string;
  env: MarkdownItEnv = {};
  md: MarkdownIt;
  tokens: Array<Token>;
  tokens_meta: Array<TokenMeta>;
  pos = 0;
  posMax = 0;
  level = 0;
  pending = "";
  pendingLevel = 0;

  // Stores { start: end } pairs. Useful for backtrack
  // optimization of pairs parse (emphasis, strikes).
  cache: Record<number, number> = {};

  // List of emphasis-like delimiters for current tag
  delimiters: Array<Delimiter> = [];

  // Stack of delimiter lists for upper level tags
  _prev_delimiters: Array<Delimiter[]> = [];

  // backtick length => last seen position
  backticks: Record<number, number> = {};
  backticksScanned = false;

  // Counter used to disable inline linkify-it execution
  // inside <a> and markdown links
  linkLevel = 0;

  constructor(
    src: string,
    md: MarkdownIt,
    env: MarkdownItEnv,
    outTokens: Array<Token>,
  ) {
    this.src = src;
    this.env = env;
    this.md = md;
    this.tokens = outTokens;
    this.tokens_meta = Array.from({ length: outTokens.length });
    this.posMax = src.length;
  }

  // Flush pending text
  //
  pushPending() {
    const token = new Token("text", "", 0);
    token.content = this.pending;
    token.level = this.pendingLevel;
    this.tokens.push(token);
    this.pending = "";
    return token;
  }

  // Push new token to "stream".
  // If pending text exists - flush it as text token
  //
  push(type: string, tag: string, nesting: TokenNestingType) {
    if (this.pending) {
      this.pushPending();
    }

    const token = new Token(type, tag, nesting);
    let token_meta: TokenMeta = null;

    if (nesting === TokenNesting.CLOSING) {
      // closing tag
      this.level--;
      this.delimiters = this._prev_delimiters.pop() ?? [];
    }

    token.level = this.level;

    if (nesting === TokenNesting.OPENING) {
      // opening tag
      this.level++;
      this._prev_delimiters.push(this.delimiters);
      this.delimiters = [];
      token_meta = { delimiters: this.delimiters };
    }

    this.pendingLevel = this.level;
    this.tokens.push(token);
    this.tokens_meta.push(token_meta);
    return token;
  }

  // Scan a sequence of emphasis-like markers, and determine whether
  // it can start an emphasis sequence or end an emphasis sequence.
  //
  //  - start - position to scan from (it should point at a valid marker);
  //  - canSplitWord - determine if these markers can be found inside a word
  //
  scanDelims(start: number, canSplitWord: boolean = false) {
    const max = this.posMax;
    const marker = this.src.charCodeAt(start);

    // treat beginning of the line as a whitespace
    const lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

    let pos = start;
    while (pos < max && this.src.charCodeAt(pos) === marker) {
      pos++;
    }

    const count = pos - start;

    // treat end of the line as a whitespace
    const nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;

    const isLastPunctChar =
      isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
    const isNextPunctChar =
      isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

    const isLastWhiteSpace = isWhiteSpace(lastChar);
    const isNextWhiteSpace = isWhiteSpace(nextChar);

    const left_flanking =
      !isNextWhiteSpace &&
      (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
    const right_flanking =
      !isLastWhiteSpace &&
      (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);

    const can_open =
      left_flanking && (canSplitWord || !right_flanking || isLastPunctChar);
    const can_close =
      right_flanking && (canSplitWord || !left_flanking || isNextPunctChar);

    return { can_open, can_close, length: count };
  }
}

StateInline.prototype.Token = Token;

export default StateInline;
