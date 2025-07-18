// Core state object
//

import MarkdownIt from "..";
import Token from "../token";

class StateCore {
  src: string;
  md: MarkdownIt;
  env: Record<string, any>;
  tokens: Array<Token> = [];
  inlineMode = false;

  static Token = Token;

  constructor(src: string, md: MarkdownIt, env: Record<string, any>) {
    this.src = src;
    this.env = env;
    this.md = md; // link to parser instance
  }
}

export default StateCore;
