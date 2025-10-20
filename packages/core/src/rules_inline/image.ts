// Process ![image](<src> "title")

import { isSpace, normalizeReference } from "@markdown-it-enhancer/shared";

import { MarkdownItEnv } from "..";
import {
  parseLinkDestination,
  parseLinkLabel,
  parseLinkTitle,
} from "../helpers";
import { ParseLinkDestinationResult } from "../helpers/parse_link_destination";
import Token, { TokenAttr } from "../token";
import StateInline from "./state_inline";

export default async function image(
  state: StateInline,
  silent: boolean = false,
) {
  let code = 0,
    content = "",
    label = "",
    pos = 0,
    ref: Exclude<MarkdownItEnv["references"], undefined>[string],
    res: ParseLinkDestinationResult,
    title = "",
    start = 0,
    href = "";
  const oldPos = state.pos;
  const max = state.posMax;

  if (state.src.charCodeAt(state.pos) !== 0x21 /* ! */) {
    return false;
  }
  if (state.src.charCodeAt(state.pos + 1) !== 0x5b /* [ */) {
    return false;
  }

  const labelStart = state.pos + 2;
  const labelEnd = await parseLinkLabel(state, state.pos + 1, false);

  // parser failed to find ']', so it's not a valid link
  if (labelEnd < 0) {
    return false;
  }

  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28 /* ( */) {
    //
    // Inline link
    //

    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0a) {
        break;
      }
    }
    if (pos >= max) {
      return false;
    }

    // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination
    start = pos;
    res = parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      }
      else {
        href = "";
      }
    }

    // [link](  <href>  "title"  )
    //                ^^ skipping these spaces
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0a) {
        break;
      }
    }

    // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title
    res = parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;

      // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0a) {
          break;
        }
      }
    }
    else {
      title = "";
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29 /* ) */) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  }
  else {
    //
    // Link reference
    //
    if (typeof state.env.references === "undefined") {
      return false;
    }

    if (pos < max && state.src.charCodeAt(pos) === 0x5b /* [ */) {
      start = pos + 1;
      pos = await parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      }
      else {
        pos = labelEnd + 1;
      }
    }
    else {
      pos = labelEnd + 1;
    }

    // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)
    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }

    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }

  //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);

    const tokens: Array<Token> = [];
    await state.md.inline.parse(content, state.md, state.env, tokens);

    const token = state.push("image", "img", 0);
    const attrs: Array<TokenAttr> = [
      ["src", href],
      ["alt", ""],
    ];
    token.attrs = attrs;
    token.children = tokens;
    token.content = content;

    if (title) {
      attrs.push(["title", title]);
    }
  }

  state.pos = pos;
  state.posMax = max;
  return true;
}
