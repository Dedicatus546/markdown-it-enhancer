import type { StateInlineRuleFn, Token } from "@markdown-it-enhancer/core";
import { parseLinkLabel } from "@markdown-it-enhancer/core/helpers";

// Process inline footnotes (^[...])
export const footnote_inline: StateInlineRuleFn = async (state, silent) => {
  const max = state.posMax;
  const start = state.pos;

  if (start + 2 >= max) {
    return false;
  }
  if (state.src.charCodeAt(start) !== 0x5e /* ^ */) {
    return false;
  }
  if (state.src.charCodeAt(start + 1) !== 0x5b /* [ */) {
    return false;
  }

  const labelStart = start + 2;
  const labelEnd = await parseLinkLabel(state, start + 1);

  // parser failed to find ']', so it's not a valid note
  if (labelEnd < 0) {
    return false;
  }

  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    if (!state.env.footnotes) {
      state.env.footnotes = {};
    }
    if (!state.env.footnotes.list) {
      state.env.footnotes.list = [];
    }
    const footnoteId = state.env.footnotes.list.length;
    const tokens: Array<Token> = [];

    await state.md.inline.parse(
      state.src.slice(labelStart, labelEnd),
      state.md,
      state.env,
      tokens,
    );

    const token = state.push("footnote_ref", "", 0);
    token.meta = { id: footnoteId };

    state.env.footnotes.list[footnoteId] = {
      content: state.src.slice(labelStart, labelEnd),
      tokens,
    };
  }

  state.pos = labelEnd + 1;
  state.posMax = max;
  return true;
};
