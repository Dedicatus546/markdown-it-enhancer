import { type StateBlockRuleFn, Token } from "@markdown-it-enhancer/core";
import { isSpace } from "@markdown-it-enhancer/shared";

// Process footnote block definition
export const footnote_def: StateBlockRuleFn = async (
  state,
  startLine,
  endLine,
  silent,
) => {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  // line should be at least 5 chars - "[^x]:"
  if (start + 4 > max) {
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
    if (state.src.charCodeAt(pos) === 0x5d /* ] */) {
      break;
    }
  }
  // no empty footnote labels
  if (pos === start + 2) {
    return false;
  }

  if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 0x3a /* : */) {
    return false;
  }
  if (silent) {
    return true;
  }
  pos++;

  if (!state.env.footnotes) {
    state.env.footnotes = {};
  }
  if (!state.env.footnotes.refs) {
    state.env.footnotes.refs = {};
  }
  const label = state.src.slice(start + 2, pos - 2);
  state.env.footnotes.refs[`:${label}`] = -1;

  const token_fref_o = new Token("footnote_reference_open", "", 1);
  token_fref_o.meta = { label };
  token_fref_o.level = state.level++;
  state.tokens.push(token_fref_o);

  const oldBMark = state.bMarks[startLine];
  const oldTShift = state.tShift[startLine];
  const oldSCount = state.sCount[startLine];
  const oldParentType = state.parentType;

  const posAfterColon = pos;
  const initial
    = state.sCount[startLine]
      + pos
      - (state.bMarks[startLine] + state.tShift[startLine]);
  let offset = initial;

  while (pos < max) {
    const ch = state.src.charCodeAt(pos);

    if (isSpace(ch)) {
      if (ch === 0x09) {
        offset += 4 - (offset % 4);
      }
      else {
        offset++;
      }
    }
    else {
      break;
    }

    pos++;
  }

  state.tShift[startLine] = pos - posAfterColon;
  state.sCount[startLine] = offset - initial;

  state.bMarks[startLine] = posAfterColon;
  state.blkIndent += 4;
  state.parentType = "footnote";

  if (state.sCount[startLine] < state.blkIndent) {
    state.sCount[startLine] += state.blkIndent;
  }

  await state.md.block.tokenize(state, startLine, endLine, true);

  state.parentType = oldParentType;
  state.blkIndent -= 4;
  state.tShift[startLine] = oldTShift;
  state.sCount[startLine] = oldSCount;
  state.bMarks[startLine] = oldBMark;

  const token_fref_c = new Token("footnote_reference_close", "", -1);
  token_fref_c.level = --state.level;
  state.tokens.push(token_fref_c);

  return true;
};
