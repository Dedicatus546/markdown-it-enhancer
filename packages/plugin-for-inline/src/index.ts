import type {
  MarkdownItPlugin,
  StateCoreRuleFn,
  Token,
} from "@markdown-it-enhancer/core";

export const forInline: MarkdownItPlugin<
  [
    string,
    string,
    (tokens: Array<Token>, index: number) => void | Promise<void>,
  ]
> = (md, ruleName, tokenType, iterator) => {
  const scan: StateCoreRuleFn = async (state) => {
    for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
      if (state.tokens[blkIdx].type !== "inline") {
        continue;
      }

      const inlineTokens = state.tokens[blkIdx].children;

      for (let i = inlineTokens.length - 1; i >= 0; i--) {
        if (inlineTokens[i].type !== tokenType) {
          continue;
        }

        await Promise.resolve(iterator(inlineTokens, i));
      }
    }
  };

  md.core.ruler.push(ruleName, scan);
};
