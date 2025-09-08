import type { MarkdownItPlugin } from "markdown-it-enhancer";

import {
  MarkdownItAnchorNormalizedOptions,
  MarkdownItAnchorOptions,
} from "./types";
import {
  getTokensText,
  isLevelSelectedArray,
  isLevelSelectedNumber,
  slugify,
  uniqueIdValue,
} from "./utils";

const defaultOptions: MarkdownItAnchorNormalizedOptions = {
  level: 1,
  slugify,
  uniqueSlugStartIndex: 1,
  tabIndex: -1,
  getTokensText,
};

export const anchor: MarkdownItPlugin<[options?: MarkdownItAnchorOptions]> = (
  md,
  options = {},
) => {
  const normalizedOptions = Object.assign({}, defaultOptions, options);

  md.core.ruler.push("anchor", (state) => {
    const slugs: Record<string, boolean> = {};
    const tokens = state.tokens;

    const isLevelSelected = Array.isArray(normalizedOptions.level)
      ? isLevelSelectedArray(normalizedOptions.level)
      : isLevelSelectedNumber(normalizedOptions.level);

    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];

      if (token.type !== "heading_open") {
        continue;
      }
      console.log(
        "Number(token.tag.substring(1))",
        Number(token.tag.substring(1)),
      );

      if (!isLevelSelected(Number(token.tag.substring(1)))) {
        continue;
      }

      // Aggregate the next token children text.
      const title = normalizedOptions.getTokensText(tokens[idx + 1].children);

      let idValue = token.attrGet("id");

      if (idValue == null) {
        if (normalizedOptions.slugifyWithState) {
          idValue = normalizedOptions.slugifyWithState(title, state);
        }
        else {
          idValue = normalizedOptions.slugify(title);
        }

        idValue = uniqueIdValue(
          idValue,
          slugs,
          false,
          normalizedOptions.uniqueSlugStartIndex,
        );
      }
      else {
        idValue = uniqueIdValue(
          idValue,
          slugs,
          true,
          normalizedOptions.uniqueSlugStartIndex,
        );
      }

      token.attrSet("id", idValue);

      if (
        normalizedOptions.tabIndex !== undefined
        && normalizedOptions.tabIndex !== false
      ) {
        token.attrSet("tabindex", `${normalizedOptions.tabIndex}`);
      }

      normalizedOptions.permalink?.(idValue, normalizedOptions, state, idx);

      // A permalink renderer could modify the `tokens` array so
      // make sure to get the up-to-date index on each iteration.
      idx = tokens.indexOf(token);
      normalizedOptions.callback?.(token, { slug: idValue, title });
    }
  });
};

export * from "./premalink";
