// Core state object
//

import MarkdownIt from "..";
import Token from "../token";

interface StateCore {
  Token: typeof Token;
}

class StateCore {
  src: string;
  md: MarkdownIt;
  env: Record<string, any> = {};
  tokens: Array<Token> = [];
  inlineMode = false;

  constructor(src: string, md: MarkdownIt, env: Record<string, any> = {}) {
    this.src = src;
    this.env = env;
    this.md = md; // link to parser instance
  }
}

StateCore.prototype.Token = Token;

export default StateCore;
