import type { StateInlineRuleFn } from "markdown-it-enhancer";

// Process footnote references ([^...])
export const footnote_ref: StateInlineRuleFn = (state, silent) => {
  const max = state.posMax;
  const start = state.pos;

  // should be at least 4 chars - "[^x]"
  if (start + 3 > max) {
    return false;
  }

  if (!state.env.footnotes || !state.env.footnotes.refs) {
    return false;
  }
  if (state.src.charCodeAt(start) !== 0x5b /* [ */) {
    return false;
  }
  if (state.src.charCodeAt(start + 1) !== 0x5e /* ^ */) {
    return false;
  }

  let pos = 0;

  for (pos = start + 2; pos < max; pos++) {
    if (state.src.charCodeAt(pos) === 0x20) {
      return false;
    }
    if (state.src.charCodeAt(pos) === 0x0a) {
      return false;
    }
    if (state.src.charCodeAt(pos) === 0x5d /* ] */) {
      break;
    }
  }

  // no empty footnote labels
  if (pos === start + 2) {
    return false;
  }
  if (pos >= max) {
    return false;
  }
  pos++;

  const label = state.src.slice(start + 2, pos - 1);
  if (state.env.footnotes.refs[`:${label}`] === undefined) {
    return false;
  }

  if (!silent) {
    if (!state.env.footnotes.list) {
      state.env.footnotes.list = [];
    }

    let footnoteId = 0;

    if (state.env.footnotes.refs[`:${label}`] < 0) {
      footnoteId = state.env.footnotes.list.length;
      state.env.footnotes.list[footnoteId] = { label, count: 0 };
      state.env.footnotes.refs[`:${label}`] = footnoteId;
    } else {
      footnoteId = state.env.footnotes.refs[`:${label}`];
    }

    const footnoteSubId = state.env.footnotes.list[footnoteId].count;
    state.env.footnotes.list[footnoteId].count!++;

    const token = state.push("footnote_ref", "", 0);
    token.meta = { id: footnoteId, subId: footnoteSubId, label };
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};
