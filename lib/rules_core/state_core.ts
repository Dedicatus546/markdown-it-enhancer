// Core state object
//

import { type MarkdownIt, MarkdownItEnv } from "..";
import Token from "../token";

interface StateCore {
  Token: typeof Token;
}

class StateCore {
  src: string;
  md: MarkdownIt;
  env: MarkdownItEnv = {};
  tokens: Array<Token> = [];
  inlineMode = false;

  constructor(src: string, md: MarkdownIt, env: MarkdownItEnv = {}) {
    this.src = src;
    this.env = env;
    this.md = md; // link to parser instance
  }
}

StateCore.prototype.Token = Token;

export default StateCore;
