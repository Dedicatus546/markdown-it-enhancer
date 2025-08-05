import type {
  MarkdownItPlugin,
  StateCoreRuleFn,
  Token,
} from "markdown-it-enhancer";

import { patterns as patternsConfig } from "./patterns";
import type {
  AttributeNormalizedOptions,
  AttributeOptions,
  PatternsResultDetectingRule,
} from "./types";
import { isArrayOfFunctions, isArrayOfObjects } from "./utils";

const defaultOptions: AttributeNormalizedOptions = {
  leftDelimiter: "{",
  rightDelimiter: "}",
  allowedAttributes: [],
};

/**
 * Test if t matches token stream.
 */
const test = (
  tokens: Array<Token>,
  i: number,
  t: PatternsResultDetectingRule,
) => {
  const res = {
    match: false,
    j: null as number | null, // position of child
  };

  const ii = (t.shift !== undefined ? i + t.shift : t.position) ?? 0;

  if (t.shift !== undefined && ii < 0) {
    // we should never shift to negative indexes (rolling around to back of array)
    return res;
  }

  const token = tokens.at(ii);

  if (token === undefined) {
    return res;
  }

  for (const key of Object.keys(t)) {
    if (key === "shift" || key === "position") {
      continue;
    }

    if ((token as unknown as Record<string, unknown>)[key] === undefined) {
      return res;
    }

    if (key === "children" && isArrayOfObjects(t.children)) {
      if (token.children.length === 0) {
        return res;
      }
      let match;
      const childTests: Array<PatternsResultDetectingRule> =
        (t.children as Array<PatternsResultDetectingRule>) ?? [];
      const children: Array<Token> = token.children;
      if (childTests.every((tt) => tt.position !== undefined)) {
        // positions instead of shifts, do not loop all children
        match = childTests.every(
          (tt) => test(children, tt.position!, tt).match,
        );
        if (match) {
          // we may need position of child in transform
          const j = (childTests.at(-1) ?? { position: null }).position ?? 0;
          res.j = j >= 0 ? j : children.length + j;
        }
      } else {
        for (let j = 0; j < children.length; j++) {
          match = childTests.every((tt) => test(children, j, tt).match);
          if (match) {
            res.j = j;
            // all tests true, continue with next key of pattern t
            break;
          }
        }
      }

      if (match === false) {
        return res;
      }

      continue;
    }

    switch (typeof (t as Record<string, unknown>)[key]) {
      case "boolean":
      case "number":
      case "string":
        // @ts-expect-error ignore
        if (token[key] !== t[key]) {
          return res;
        }
        break;
      case "function":
        // @ts-expect-error ignore
        if (!t[key](token[key])) {
          return res;
        }
        break;
      case "object":
        // @ts-expect-error ignore
        if (isArrayOfFunctions(t[key])) {
          // @ts-expect-error ignore
          const r = t[key].every((tt) => tt(token[key]));
          if (r === false) {
            return res;
          }
          break;
        }
      // fall through for objects !== arrays of functions
      default:
        throw new Error(
          `Unknown type of pattern test (key: ${key}). Test should be of type boolean, number, string, function or array of functions.`,
        );
    }
  }

  // no tests returned false -> all tests returns true
  res.match = true;
  return res;
};

export const attributes: MarkdownItPlugin<[options?: AttributeOptions]> = (
  md,
  options,
) => {
  const normalizedOptions = Object.assign({}, defaultOptions, options);

  const patterns = patternsConfig(normalizedOptions);

  const curlyAttrs: StateCoreRuleFn = (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      for (let p = 0; p < patterns.length; p++) {
        const pattern = patterns[p];
        let j = null; // position of child with offset 0
        const match = pattern.tests.every((t) => {
          const res = test(tokens, i, t);
          if (res.j !== null) {
            j = res.j;
          }
          return res.match;
        });
        if (match) {
          pattern.transform(tokens, i, j!);
          if (
            pattern.name === "inline attributes" ||
            pattern.name === "inline nesting 0"
          ) {
            // retry, may be several inline attributes
            p--;
          }
        }
      }
    }
  };

  md.core.ruler.before("linkify", "curly_attributes", curlyAttrs);
};
