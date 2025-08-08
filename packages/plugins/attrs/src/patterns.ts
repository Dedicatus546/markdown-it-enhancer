import { type Token, TokenNesting } from "markdown-it-enhancer";

import type { AttributeNormalizedOptions, PatternsResult } from "./types";
import {
  addAttrs,
  escapeRegExp,
  getAttrs,
  getMatchingOpeningToken,
  hasDelimiters,
  hidden,
  removeDelimiter,
} from "./utils";

declare module "markdown-it-enhancer" {
  export interface TokenMeta {
    colsnum?: number;
  }
}

export const patterns = (
  options: AttributeNormalizedOptions,
): PatternsResult => {
  const __hr = new RegExp(
    "^ {0,3}[-*_]{3,} ?" +
      escapeRegExp(options.leftDelimiter) +
      "[^" +
      escapeRegExp(options.rightDelimiter) +
      "]",
  );

  return [
    {
      /**
       * ```python {.cls}
       * for i in range(10):
       *     print(i)
       * ```
       */
      name: "fenced code blocks",
      tests: [
        {
          shift: 0,
          block: true,
          info: hasDelimiters("end", options),
        },
      ],
      transform: (tokens, i) => {
        const token = tokens[i];
        const start = token.info.lastIndexOf(options.leftDelimiter);
        const attrs = getAttrs(token.info, start, options);
        addAttrs(attrs, token);
        token.info = removeDelimiter(token.info, options);
      },
    },
    {
      /**
       * bla `click()`{.c} ![](img.png){.d}
       *
       * differs from 'inline attributes' as it does
       * not have a closing tag (nesting: -1)
       */
      name: "inline nesting 0",
      tests: [
        {
          shift: 0,
          type: "inline",
          children: [
            {
              shift: -1,
              type: (str: string) => str === "image" || str === "code_inline",
            },
            {
              shift: 0,
              type: "text",
              content: hasDelimiters("start", options),
            },
          ],
        },
      ],
      transform: (tokens, i, j) => {
        const token = tokens[i].children[j];
        const endChar = token.content.indexOf(options.rightDelimiter);
        const attrToken = tokens[i].children[j - 1];
        const attrs = getAttrs(token.content, 0, options);
        addAttrs(attrs, attrToken);
        if (token.content.length === endChar + options.rightDelimiter.length) {
          tokens[i].children.splice(j, 1);
        } else {
          token.content = token.content.slice(
            endChar + options.rightDelimiter.length,
          );
        }
      },
    },
    {
      /**
       * | h1 |
       * | -- |
       * | c1 |
       *
       * {.c}
       */
      name: "tables",
      tests: [
        {
          // let this token be i, such that for-loop continues at
          // next token after tokens.splice
          shift: 0,
          type: "table_close",
        },
        {
          shift: 1,
          type: "paragraph_open",
        },
        {
          shift: 2,
          type: "inline",
          content: hasDelimiters("only", options),
        },
      ],
      transform: (tokens, i) => {
        const token = tokens[i + 2];
        const tableOpen = getMatchingOpeningToken(tokens, i) as Token;
        const attrs = getAttrs(token.content, 0, options);
        // add attributes
        addAttrs(attrs, tableOpen);
        // remove <p>{.c}</p>
        tokens.splice(i + 1, 3);
      },
    },
    {
      /**
       * | A | B |
       * | -- | -- |
       * | 1 | 2 |
       *
       * | C | D |
       * | -- | -- |
       *
       * only `| A | B |` sets the colsnum metadata
       */
      name: "tables thead metadata",
      tests: [
        {
          shift: 0,
          type: "tr_close",
        },
        {
          shift: 1,
          type: "thead_close",
        },
        {
          shift: 2,
          type: "tbody_open",
        },
      ],
      transform: (tokens, i) => {
        const tr = getMatchingOpeningToken(tokens, i);
        const th = tokens[i - 1];
        let colsnum = 0;
        let n = i;
        while (--n) {
          if (tokens[n] === tr) {
            tokens[n - 1].meta = Object.assign({}, tokens[n + 2].meta, {
              colsnum,
            });
            break;
          }
          colsnum +=
            tokens[n].level === th.level && tokens[n].type === th.type ? 1 : 0;
        }
        tokens[i + 2].meta = Object.assign({}, tokens[i + 2].meta, { colsnum });
      },
    },
    {
      /**
       * | A | B | C | D |
       * | -- | -- | -- | -- |
       * | 1 | 11 | 111 | 1111 {rowspan=3} |
       * | 2 {colspan=2 rowspan=2} | 22 | 222 | 2222 |
       * | 3 | 33 | 333 | 3333 |
       */
      name: "tables tbody calculate",
      tests: [
        {
          shift: 0,
          type: "tbody_close",
          hidden: false,
        },
      ],
      transform: (tokens, i) => {
        /** index of the tbody beginning */
        let idx = i - 2;
        while (idx > 0 && "tbody_open" !== tokens[--idx].type);

        const calc = tokens[idx].meta?.colsnum ?? 0;
        if (calc < 2) {
          return;
        }

        const level = tokens[i].level + 2;
        for (let n = idx; n < i; n++) {
          if (tokens[n].level > level) {
            continue;
          }

          const token = tokens[n];
          const rows = token.hidden
            ? 0
            : Number.parseInt(token.attrGet("rowspan") ?? "0");
          const cols = token.hidden
            ? 0
            : Number.parseInt(token.attrGet("colspan") ?? "0");

          if (rows > 1) {
            let colsnum = calc - (cols > 0 ? cols : 1);
            for (let k = n, num = rows; num > 1; k++) {
              if ("tr_open" == tokens[k].type) {
                tokens[k].meta = Object.assign({}, tokens[k].meta);
                if (tokens[k].meta && tokens[k].meta?.colsnum) {
                  colsnum -= 1;
                }
                tokens[k].meta!.colsnum = colsnum;
                num--;
              }
            }
          }

          if ("tr_open" == token.type && token.meta && token.meta.colsnum) {
            const max = token.meta.colsnum;
            for (let k = n, num = 0; k < i; k++) {
              if ("td_open" == tokens[k].type) {
                num += 1;
              } else if ("tr_close" == tokens[k].type) {
                break;
              }
              if (num > max && !tokens[k].hidden) {
                hidden(tokens[k]);
              }
            }
          }

          if (cols > 1) {
            /** index of one row's children */
            const one: Array<number> = [];
            /** last index of the row's children */
            let end = n + 3;
            /** number of the row's children */
            let num = calc;

            for (let k = n; k > idx; k--) {
              if ("tr_open" == tokens[k].type) {
                num = tokens[k].meta?.colsnum ?? num;
                break;
              } else if ("td_open" === tokens[k].type) {
                one.unshift(k);
              }
            }

            for (let k = n + 2; k < i; k++) {
              if ("tr_close" == tokens[k].type) {
                end = k;
                break;
              } else if ("td_open" == tokens[k].type) {
                one.push(k);
              }
            }

            const off = one.indexOf(n);
            let real = num - off;
            real = real > cols ? cols : real;
            if (cols > real) {
              token.attrSet("colspan", real + "");
            }

            for (let k = one.slice(num + 1 - calc - real)[0]; k < end; k++) {
              if (!tokens[k].hidden) {
                hidden(tokens[k]);
              }
            }
          }
        }
      },
    },
    {
      /**
       * *emphasis*{.with attrs=1}
       */
      name: "inline attributes",
      tests: [
        {
          shift: 0,
          type: "inline",
          children: [
            {
              shift: -1,
              nesting: -1, // closing inline tag, </em>{.a}
            },
            {
              shift: 0,
              type: "text",
              content: hasDelimiters("start", options),
            },
          ],
        },
      ],
      transform: (tokens, i, j) => {
        const token = tokens[i].children[j];
        const content = token.content;
        const attrs = getAttrs(content, 0, options);
        const openingToken = getMatchingOpeningToken(
          tokens[i].children,
          j - 1,
        ) as Token;
        addAttrs(attrs, openingToken);
        token.content = content.slice(
          content.indexOf(options.rightDelimiter) +
            options.rightDelimiter.length,
        );
      },
    },
    {
      /**
       * - item
       * {.a}
       */
      name: "list softbreak",
      tests: [
        {
          shift: -2,
          type: "list_item_open",
        },
        {
          shift: 0,
          type: "inline",
          children: [
            {
              position: -2,
              type: "softbreak",
            },
            {
              position: -1,
              type: "text",
              content: hasDelimiters("only", options),
            },
          ],
        },
      ],
      transform: (tokens, i, j) => {
        const token = tokens[i].children[j];
        const content = token.content;
        const attrs = getAttrs(content, 0, options);
        let ii = i - 2;
        while (
          tokens[ii - 1] &&
          tokens[ii - 1].type !== "ordered_list_open" &&
          tokens[ii - 1].type !== "bullet_list_open"
        ) {
          ii--;
        }
        addAttrs(attrs, tokens[ii - 1]);
        tokens[i].children = tokens[i].children.slice(0, -2);
      },
    },
    {
      /**
       * - nested list
       *   - with double \n
       *   {.a} <-- apply to nested ul
       *
       * {.b} <-- apply to root <ul>
       */
      name: "list double softbreak",
      tests: [
        {
          // let this token be i = 0 so that we can erase
          // the <p>{.a}</p> tokens below
          shift: 0,
          type: (str) =>
            str === "bullet_list_close" || str === "ordered_list_close",
        },
        {
          shift: 1,
          type: "paragraph_open",
        },
        {
          shift: 2,
          type: "inline",
          content: hasDelimiters("only", options),
          children: (arr) => arr.length === 1,
        },
        {
          shift: 3,
          type: "paragraph_close",
        },
      ],
      transform: (tokens, i) => {
        const token = tokens[i + 2];
        const content = token.content;
        const attrs = getAttrs(content, 0, options);
        const openingToken = getMatchingOpeningToken(tokens, i) as Token;
        addAttrs(attrs, openingToken);
        tokens.splice(i + 1, 3);
      },
    },
    {
      /**
       * - end of {.list-item}
       */
      name: "list item end",
      tests: [
        {
          shift: -2,
          type: "list_item_open",
        },
        {
          shift: 0,
          type: "inline",
          children: [
            {
              position: -1,
              type: "text",
              content: hasDelimiters("end", options),
            },
          ],
        },
      ],
      transform: (tokens, i, j) => {
        const token = tokens[i].children[j];
        const content = token.content;
        const attrs = getAttrs(
          content,
          content.lastIndexOf(options.leftDelimiter),
          options,
        );
        addAttrs(attrs, tokens[i - 2]);
        const trimmed = content.slice(
          0,
          content.lastIndexOf(options.leftDelimiter),
        );
        token.content = trimmed.at(-1) !== " " ? trimmed : trimmed.slice(0, -1);
      },
    },
    {
      /**
       * something with softbreak
       * {.cls}
       */
      name: "\n{.a} softbreak then curly in start",
      tests: [
        {
          shift: 0,
          type: "inline",
          children: [
            {
              position: -2,
              type: "softbreak",
            },
            {
              position: -1,
              type: "text",
              content: hasDelimiters("only", options),
            },
          ],
        },
      ],
      transform: (tokens, i, j) => {
        const token = tokens[i].children[j];
        const attrs = getAttrs(token.content, 0, options);
        // find last closing tag
        let ii = i + 1;
        while (
          tokens[ii + 1] &&
          tokens[ii + 1].nesting === TokenNesting.CLOSING
        ) {
          ii++;
        }
        const openingToken = getMatchingOpeningToken(tokens, ii) as Token;
        addAttrs(attrs, openingToken);
        tokens[i].children = tokens[i].children.slice(0, -2);
      },
    },
    {
      /**
       * horizontal rule --- {#id}
       */
      name: "horizontal rule",
      tests: [
        {
          shift: 0,
          type: "paragraph_open",
        },
        {
          shift: 1,
          type: "inline",
          children: (arr) => arr.length === 1,
          content: (str) => str.match(__hr) !== null,
        },
        {
          shift: 2,
          type: "paragraph_close",
        },
      ],
      transform: (tokens, i) => {
        const token = tokens[i];
        token.type = "hr";
        token.tag = "hr";
        token.nesting = TokenNesting.SELF_CLOSING;
        const content = tokens[i + 1].content;
        const start = content.lastIndexOf(options.leftDelimiter);
        const attrs = getAttrs(content, start, options);
        addAttrs(attrs, token);
        token.markup = content;
        tokens.splice(i + 1, 2);
      },
    },
    {
      /**
       * end of {.block}
       */
      name: "end of block",
      tests: [
        {
          shift: 0,
          type: "inline",
          children: [
            {
              position: -1,
              content: hasDelimiters("end", options),
              type: (t) => t !== "code_inline" && t !== "math_inline",
            },
          ],
        },
      ],
      transform: (tokens, i, j) => {
        const token = tokens[i].children[j];
        const content = token.content;
        const attrs = getAttrs(
          content,
          content.lastIndexOf(options.leftDelimiter),
          options,
        );
        let ii = i + 1;
        do
          if (tokens[ii] && tokens[ii].nesting === TokenNesting.CLOSING) {
            break;
          }
        while (ii++ < tokens.length);
        const openingToken = getMatchingOpeningToken(tokens, ii) as Token;
        addAttrs(attrs, openingToken);
        const trimmed = content.slice(
          0,
          content.lastIndexOf(options.leftDelimiter),
        );
        token.content = trimmed.at(-1) !== " " ? trimmed : trimmed.slice(0, -1);
      },
    },
  ];
};
