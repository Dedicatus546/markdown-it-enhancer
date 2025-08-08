/**
 * class Renderer
 *
 * Generates HTML from parsed token stream. Each instance has independent
 * copy of rules. Those can be rewritten with ease. Also, you can add new
 * rules if you create plugin and adds new token types.
 **/

import { MarkdownItEnv, MarkdownItOptions } from "..";
import { escapeHtml, resolvePromiseLike } from "../common/utils";
import Token, { TokenNesting } from "../token";
import {
  code_block,
  code_inline,
  fence,
  hardbreak,
  html_block,
  html_inline,
  image,
  softbreak,
  text,
} from "./default_rules";

export type RendererFn<Async extends "sync" | "async" = "async"> = (
  tokens: Array<Token>,
  idx: number,
  options: MarkdownItOptions,
  env: MarkdownItEnv,
  slf: Renderer,
) => Async extends "async"
  ? PromiseLike<string>
  : Async extends "sync"
    ? string
    : never;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RendererExtendsRules {}

interface RendererDefaultRules {
  code_inline: RendererFn<"sync">;
  code_block: RendererFn<"sync">;
  fence: RendererFn;
  image: RendererFn<"sync">;
  hardbreak: RendererFn<"sync">;
  softbreak: RendererFn<"sync">;
  text: RendererFn<"sync">;
  html_block: RendererFn<"sync">;
  html_inline: RendererFn<"sync">;
}

type RendererRules = RendererDefaultRules & RendererExtendsRules;

const default_rules: RendererDefaultRules = {
  code_block,
  code_inline,
  fence,
  hardbreak,
  html_block,
  html_inline,
  image,
  softbreak,
  text,
};

const hasRenderRule = (
  rules: RendererRules,
  type: string,
): type is keyof RendererRules => {
  return rules[type as keyof RendererRules] !== undefined;
};

class Renderer {
  rules: RendererRules = Object.assign({}, default_rules);

  renderAttrs(token: Pick<Token, "attrs">) {
    if (!token.attrs) {
      return "";
    }

    let result = "";

    for (let i = 0, len = token.attrs.length; i < len; i++) {
      result +=
        " " +
        escapeHtml(token.attrs[i][0]) +
        '="' +
        escapeHtml(token.attrs[i][1]) +
        '"';
    }

    return result;
  }

  renderToken(tokens: Array<Token>, idx: number, options: MarkdownItOptions) {
    const token = tokens[idx];
    let result = "";

    // Tight list paragraphs
    if (token.hidden) {
      return "";
    }

    // Insert a newline between hidden paragraph and subsequent opening
    // block-level tag.
    //
    // For example, here we should insert a newline before blockquote:
    //  - a
    //    >
    //
    if (
      token.block &&
      token.nesting !== TokenNesting.CLOSING &&
      idx &&
      tokens[idx - 1].hidden
    ) {
      result += "\n";
    }

    // Add token name, e.g. `<img`
    result += (token.nesting === TokenNesting.CLOSING ? "</" : "<") + token.tag;

    // Encode attributes, e.g. `<img src="foo"`
    result += this.renderAttrs(token);

    // Add a slash for self-closing tags, e.g. `<img src="foo" /`
    if (token.nesting === TokenNesting.SELF_CLOSING && options.xhtmlOut) {
      result += " /";
    }

    // Check if we need to add a newline after this tag
    let needLf = false;
    if (token.block) {
      needLf = true;

      if (token.nesting === TokenNesting.OPENING) {
        if (idx + 1 < tokens.length) {
          const nextToken = tokens[idx + 1];

          if (nextToken.type === "inline" || nextToken.hidden) {
            // Block-level tag containing an inline tag.
            //
            needLf = false;
          } else if (
            nextToken.nesting === TokenNesting.CLOSING &&
            nextToken.tag === token.tag
          ) {
            // Opening tag + closing tag of the same type. E.g. `<li></li>`.
            //
            needLf = false;
          }
        }
      }
    }

    result += needLf ? ">\n" : ">";

    return result;
  }

  async renderInline(
    tokens: Array<Token>,
    options: MarkdownItOptions,
    env: MarkdownItEnv = {},
  ) {
    let result = "";
    const rules = this.rules;

    for (let i = 0, len = tokens.length; i < len; i++) {
      const type = tokens[i].type;

      if (hasRenderRule(rules, type)) {
        result += await resolvePromiseLike(
          rules[type](tokens, i, options, env, this),
        );
      } else {
        result += this.renderToken(tokens, i, options);
      }
    }

    return result;
  }

  renderInlineAsText(
    tokens: Array<Token>,
    options: MarkdownItOptions,
    env: MarkdownItEnv = {},
  ) {
    let result = "";

    for (let i = 0, len = tokens.length; i < len; i++) {
      switch (tokens[i].type) {
        case "text":
          result += tokens[i].content;
          break;
        case "image":
          result += this.renderInlineAsText(tokens[i].children, options, env);
          break;
        case "html_inline":
        case "html_block":
          result += tokens[i].content;
          break;
        case "softbreak":
        case "hardbreak":
          result += "\n";
          break;
        default:
        // all other tokens are skipped
      }
    }

    return result;
  }

  async render(
    tokens: Array<Token>,
    options: MarkdownItOptions,
    env: MarkdownItEnv = {},
  ) {
    let result = "";
    const rules = this.rules;

    for (let i = 0, len = tokens.length; i < len; i++) {
      const type = tokens[i].type;

      if (type === "inline") {
        result += await this.renderInline(tokens[i].children, options, env);
      } else if (hasRenderRule(rules, type)) {
        result += await resolvePromiseLike(
          rules[type](tokens, i, options, env, this),
        );
      } else {
        result += this.renderToken(tokens, i, options);
      }
    }

    return result;
  }
}

export default Renderer;
