// Emojies & shortcuts replacement logic.
//
// Note: In theory, it could be faster to parse :smile: in inline chain and
// leave only shortcuts here. But, who care...
import { MarkdownIt, StateCoreRuleFn, Token } from "@markdown-it-enhancer/core";
import { arrayReplaceAt } from "@markdown-it-enhancer/core/utils";
import { Cc, P, Z } from "@markdown-it-enhancer/uc.micro";

import type { EmojiNormalizedOptions } from "./types";

export const emoji_replace = (
  _md: MarkdownIt,
  options: EmojiNormalizedOptions,
) => {
  const { defs: emojies, shortcuts, replaceRE, scanRE } = options;
  const ZPCc = new RegExp([Z.source, P.source, Cc.source].join("|"));

  const splitTextToken = (text: string) => {
    let last_pos = 0;
    const nodes: Array<Token> = [];

    text.replace(replaceRE, (match, offset: number, src: string) => {
      let emoji_name: string;
      // Validate emoji name
      if (Object.hasOwn(shortcuts, match)) {
        // replace shortcut with full name
        emoji_name = shortcuts[match];

        // Don't allow letters before any shortcut (as in no ":/" in http://)
        if (offset > 0 && !ZPCc.test(src[offset - 1])) {
          return "";
        }

        // Don't allow letters after any shortcut
        if (
          offset + match.length < src.length
          && !ZPCc.test(src[offset + match.length])
        ) {
          return "";
        }
      }
      else {
        emoji_name = match.slice(1, -1);
      }

      // Add new tokens to pending list
      if (offset > last_pos) {
        const textToken = new Token("text", "", 0);
        textToken.content = text.slice(last_pos, offset);
        nodes.push(textToken);
      }

      const emojiToken = new Token("emoji", "", 0);
      emojiToken.markup = emoji_name;
      emojiToken.content = emojies[emoji_name];
      nodes.push(emojiToken);

      last_pos = offset + match.length;

      return "";
    });

    if (last_pos < text.length) {
      const textToken = new Token("text", "", 0);
      textToken.content = text.slice(last_pos);
      nodes.push(textToken);
    }

    return nodes;
  };

  const emoji_replace: StateCoreRuleFn = (state) => {
    let token: Token;
    const blockTokens = state.tokens;
    let autolinkLevel = 0;

    for (let j = 0, l = blockTokens.length; j < l; j++) {
      if (blockTokens[j].type !== "inline") {
        continue;
      }
      let tokens = blockTokens[j].children;

      // We scan from the end, to keep position when new tags added.
      // Use reversed logic in links start/end match
      for (let i = tokens.length - 1; i >= 0; i--) {
        token = tokens[i];

        if (token.type === "link_open" || token.type === "link_close") {
          if (token.info === "auto") {
            autolinkLevel -= token.nesting;
          }
        }

        if (
          token.type === "text"
          && autolinkLevel === 0
          && scanRE.test(token.content)
        ) {
          // replace current node
          blockTokens[j].children = tokens = arrayReplaceAt(
            tokens,
            i,
            splitTextToken(token.content),
          );
        }
      }
    }
  };

  return emoji_replace;
};
