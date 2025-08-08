import type { StateCoreRuleFn } from "markdown-it-enhancer";
import { Token } from "markdown-it-enhancer";

// Glue footnote tokens to end of token stream
export const footnote_tail: StateCoreRuleFn = (state) => {
  let tokens: Array<Token> = [];
  let current: Array<Token> = [];
  let currentLabel = "";
  let insideRef = false;
  const refTokens: Record<string, Array<Token>> = {};

  if (!state.env.footnotes) {
    return;
  }

  state.tokens = state.tokens.filter((token) => {
    if (token.type === "footnote_reference_open") {
      insideRef = true;
      current = [];
      currentLabel = token.meta?.label ?? "";
      return false;
    }
    if (token.type === "footnote_reference_close") {
      insideRef = false;
      // prepend ':' to avoid conflict with Object.prototype members
      refTokens[":" + currentLabel] = current;
      return false;
    }
    if (insideRef) {
      current.push(token);
    }
    return !insideRef;
  });

  if (!state.env.footnotes.list) {
    return;
  }
  const list = state.env.footnotes.list;

  state.tokens.push(new Token("footnote_block_open", "", 1));

  for (let i = 0, l = list.length; i < l; i++) {
    const token_fo = new Token("footnote_open", "", 1);
    token_fo.meta = { id: i, label: list[i].label };
    state.tokens.push(token_fo);

    if (list[i].tokens) {
      tokens = [];

      const token_po = new Token("paragraph_open", "p", 1);
      token_po.block = true;
      tokens.push(token_po);

      const token_i = new Token("inline", "", 0);
      token_i.children = list[i].tokens ?? [];
      token_i.content = list[i].content ?? "";
      tokens.push(token_i);

      const token_pc = new Token("paragraph_close", "p", -1);
      token_pc.block = true;
      tokens.push(token_pc);
    } else if (list[i].label) {
      tokens = refTokens[`:${list[i].label}`];
    }

    if (tokens) {
      state.tokens = state.tokens.concat(tokens);
    }

    let lastParagraph: Token | null = null;

    if (state.tokens[state.tokens.length - 1].type === "paragraph_close") {
      lastParagraph = state.tokens.pop()!;
    } else {
      lastParagraph = null;
    }

    const t = (list[i].count ?? 0) > 0 ? (list[i].count ?? 0) : 1;
    for (let j = 0; j < t; j++) {
      const token_a = new Token("footnote_anchor", "", 0);
      token_a.meta = { id: i, subId: j, label: list[i].label };
      state.tokens.push(token_a);
    }

    if (lastParagraph !== null) {
      state.tokens.push(lastParagraph);
    }

    state.tokens.push(new Token("footnote_close", "", -1));
  }

  state.tokens.push(new Token("footnote_block_close", "", -1));
};
