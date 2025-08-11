// Enclose abbreviations in <abbr> tags

import type {
  MarkdownItPlugin,
  StateBlockRuleFn,
  StateCoreRuleFn,
} from "markdown-it-enhancer";
import { P, Z } from "markdown-it-enhancer/ucmicro";
import { arrayReplaceAt, escapeRE } from "markdown-it-enhancer/utils";

declare module "markdown-it-enhancer" {
  export interface MarkdownItEnv {
    abbreviations?: Record<string, string>
  }
}

//
export const abbr: MarkdownItPlugin = (md) => {
  // ASCII characters in Cc, Sc, Sm, Sk categories we should terminate on;
  // you can check character classes here:
  // http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
  const OTHER_CHARS = " \r\n$+<=>^`|~";

  const UNICODE_PUNCT_RE = P.source;
  const UNICODE_SPACE_RE = Z.source;

  const abbr_def: StateBlockRuleFn = (state, startLine, _endLine, silent) => {
    let labelEnd = 0;
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    if (pos + 2 >= max) {
      return false;
    }

    if (state.src.charCodeAt(pos++) !== 0x2a /* * */) {
      return false;
    }

    if (state.src.charCodeAt(pos++) !== 0x5b /* [ */) {
      return false;
    }

    const labelStart = pos;

    for (; pos < max; pos++) {
      const ch = state.src.charCodeAt(pos);
      if (ch === 0x5b /* [ */) {
        return false;
      }
      else if (ch === 0x5d /* ] */) {
        labelEnd = pos;
        break;
      }
      else if (ch === 0x5c /* \ */) {
        pos++;
      }
    }

    if (labelEnd < 0 || state.src.charCodeAt(labelEnd + 1) !== 0x3a /* : */) {
      return false;
    }

    if (silent) {
      return true;
    }

    const label = state.src.slice(labelStart, labelEnd).replace(/\\(.)/g, "$1");
    const title = state.src.slice(labelEnd + 2, max).trim();
    if (label.length === 0) {
      return false;
    }

    if (title.length === 0) {
      return false;
    }

    if (!state.env.abbreviations) {
      state.env.abbreviations = {};
    }
    // prepend ':' to avoid conflict with Object.prototype members
    if (typeof state.env.abbreviations[":" + label] === "undefined") {
      state.env.abbreviations[":" + label] = title;
    }

    state.line = startLine + 1;
    return true;
  };

  const abbr_replace: StateCoreRuleFn = (state) => {
    const blockTokens = state.tokens;

    if (!state.env.abbreviations) {
      return;
    }

    const regSimple = new RegExp(
      "(?:"
      + Object.keys(state.env.abbreviations)
        .map(x => x.substring(1))
        .sort((a, b) => b.length - a.length)
        .map(escapeRE)
        .join("|")
        + ")",
    );

    const regText
      = "(^|"
        + UNICODE_PUNCT_RE
        + "|"
        + UNICODE_SPACE_RE
        + "|["
        + OTHER_CHARS.split("").map(escapeRE).join("")
        + "])"
        + "("
        + Object.keys(state.env.abbreviations)
          .map(x => x.substring(1))
          .sort((a, b) => b.length - a.length)
          .map(escapeRE)
          .join("|")
          + ")"
          + "($|"
          + UNICODE_PUNCT_RE
          + "|"
          + UNICODE_SPACE_RE
          + "|["
          + OTHER_CHARS.split("").map(escapeRE).join("")
          + "])";

    const reg = new RegExp(regText, "g");

    for (let j = 0, l = blockTokens.length; j < l; j++) {
      if (blockTokens[j].type !== "inline") {
        continue;
      }
      let tokens = blockTokens[j].children;

      // We scan from the end, to keep position when new tags added.
      for (let i = tokens.length - 1; i >= 0; i--) {
        const currentToken = tokens[i];
        if (currentToken.type !== "text") {
          continue;
        }

        let pos = 0;
        const text = currentToken.content;
        reg.lastIndex = 0;
        const nodes = [];

        // fast regexp run to determine whether there are any abbreviated words
        // in the current token
        if (!regSimple.test(text)) {
          continue;
        }

        let m;

        while ((m = reg.exec(text))) {
          if (m.index > 0 || m[1].length > 0) {
            const token = new state.Token("text", "", 0);
            token.content = text.slice(pos, m.index + m[1].length);
            nodes.push(token);
          }

          const token_o = new state.Token("abbr_open", "abbr", 1);
          token_o.attrs = [["title", state.env.abbreviations[":" + m[2]]]];
          nodes.push(token_o);

          const token_t = new state.Token("text", "", 0);
          token_t.content = m[2];
          nodes.push(token_t);

          const token_c = new state.Token("abbr_close", "abbr", -1);
          nodes.push(token_c);

          reg.lastIndex -= m[3].length;
          pos = reg.lastIndex;
        }

        if (!nodes.length) {
          continue;
        }

        if (pos < text.length) {
          const token = new state.Token("text", "", 0);
          token.content = text.slice(pos);
          nodes.push(token);
        }

        // replace current node
        blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
      }
    }
  };

  md.block.ruler.before("reference", "abbr_def", abbr_def, {
    alt: ["paragraph", "reference"],
  });

  md.core.ruler.after("linkify", "abbr_replace", abbr_replace);
};
