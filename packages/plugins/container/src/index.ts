// Process block-level custom containers

import {
  type MarkdownItPlugin,
  type RendererFn,
  type StateBlockRuleFn,
  TokenNesting,
} from "markdown-it-enhancer";

import { ContainerNormalizedOptions, ContainerOptions } from "./types";

declare module "markdown-it-enhancer" {
  export interface RendererExtendsRules {
    [ruleName: `container_${string}_open`]: RendererFn
    [ruleName: `container_${string}_close`]: RendererFn
  }
}

//
export const container: MarkdownItPlugin<
  [string, options?: ContainerOptions]
> = (md, name, options) => {
  const defaultOptions: ContainerNormalizedOptions = {
    marker: ":",
    // Second param may be useful if you decide
    // to increase minimal allowed marker length
    validate: src => src.trim().split(" ", 2)[0] === name,
    render: (tokens, idx, _options, _env, renderer) => {
      // add a class to the opening tag
      if (tokens[idx].nesting === TokenNesting.OPENING) {
        tokens[idx].attrJoin("class", name);
      }

      return renderer.renderToken(tokens, idx, _options);
    },
  };
  const normalizedOptions = Object.assign({}, defaultOptions, options);

  const min_markers = 3;
  const marker_char = normalizedOptions.marker.charCodeAt(0);
  const marker_len = normalizedOptions.marker.length;

  const container: StateBlockRuleFn = async (
    state,
    startLine,
    endLine,
    silent,
  ) => {
    let pos: number;
    let auto_closed = false;
    let start = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // Check out the first character quickly,
    // this should filter out most of non-containers
    //
    if (marker_char !== state.src.charCodeAt(start)) {
      return false;
    }

    // Check out the rest of the marker string
    //
    for (pos = start + 1; pos <= max; pos++) {
      if (
        normalizedOptions.marker[(pos - start) % marker_len] !== state.src[pos]
      ) {
        break;
      }
    }

    const marker_count = Math.floor((pos - start) / marker_len);
    if (marker_count < min_markers) {
      return false;
    }
    pos -= (pos - start) % marker_len;

    const markup = state.src.slice(start, pos);
    const params = state.src.slice(pos, max);
    if (!normalizedOptions.validate(params, markup)) {
      return false;
    }

    // Since start is found, we can report success here in validation mode
    //
    if (silent) {
      return true;
    }

    // Search for the end of the block
    //
    let nextLine = startLine;

    for (;;) {
      nextLine++;
      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break;
      }

      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (start < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - ```
        //  test
        break;
      }

      if (marker_char !== state.src.charCodeAt(start)) {
        continue;
      }

      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        // closing fence should be indented less than 4 spaces
        continue;
      }

      for (pos = start + 1; pos <= max; pos++) {
        if (
          normalizedOptions.marker[(pos - start) % marker_len]
          !== state.src[pos]
        ) {
          break;
        }
      }

      // closing code fence must be at least as long as the opening one
      if (Math.floor((pos - start) / marker_len) < marker_count) {
        continue;
      }

      // make sure tail has spaces only
      pos -= (pos - start) % marker_len;
      pos = state.skipSpaces(pos);

      if (pos < max) {
        continue;
      }

      // found!
      auto_closed = true;
      break;
    }

    const old_parent = state.parentType;
    const old_line_max = state.lineMax;
    state.parentType = "container";

    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax = nextLine;

    const token_o = state.push("container_" + name + "_open", "div", 1);
    token_o.markup = markup;
    token_o.block = true;
    token_o.info = params;
    token_o.map = [startLine, nextLine];

    await state.md.block.tokenize(state, startLine + 1, nextLine);

    const token_c = state.push("container_" + name + "_close", "div", -1);
    token_c.markup = state.src.slice(start, pos);
    token_c.block = true;

    state.parentType = old_parent;
    state.lineMax = old_line_max;
    state.line = nextLine + (auto_closed ? 1 : 0);

    return true;
  };

  md.block.ruler.before("fence", "container_" + name, container, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.renderer.rules[`container_${name}_open`] = normalizedOptions.render;
  md.renderer.rules[`container_${name}_close`] = normalizedOptions.render;
};
