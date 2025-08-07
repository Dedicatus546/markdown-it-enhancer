import { LinkifyIt } from "linkify-it-for-enhancer";

import {
  isString,
  normalizeLink,
  normalizeLinkText,
  resolvePromiseLike,
  validateLink,
} from "./common/utils";
import ParserBlock from "./parser_block";
import ParserCore from "./parser_core";
import ParserInline from "./parser_inline";
import { isValidPresetName, Preset, PresetName, presets } from "./presets";
import Renderer from "./renderer";
import StateCore from "./rules_core/state_core";
import { Awaitable } from "./types";

export { default as ParserBlock } from "./parser_block";
export { default as ParserCore } from "./parser_core";
export { default as ParserInline } from "./parser_inline";
export { default as StateBlock } from "./rules_block/state_block";
export { default as StateCore } from "./rules_core/state_core";
export { default as StateInline } from "./rules_inline/state_inline";

export interface MarkdownItPlugin<Args extends unknown[] = []> {
  (...args: [MarkdownIt, ...rest: [...Args]]): Awaitable<void>;
}

export type MarkdownItOptions = Partial<Omit<Preset["options"], "maxNesting">>;

export interface MarkdownItEnv {
  references?: {
    [key: string]: { title: string; href: string };
  };
  maxAutoCompletedCells?: number;
  [key: string]: unknown;
}

export class MarkdownIt {
  inline = new ParserInline();
  block = new ParserBlock();
  core = new ParserCore();
  renderer = new Renderer();
  linkify = new LinkifyIt();
  validateLink = validateLink;
  normalizeLink = normalizeLink;
  normalizeLinkText = normalizeLinkText;
  options: Preset["options"];
  plugins: Array<Promise<void>> = [];

  constructor(
    presetNameOrOptions?: PresetName | MarkdownItOptions,
    options?: MarkdownItOptions,
  ) {
    if (!options) {
      if (!isString(presetNameOrOptions)) {
        options = presetNameOrOptions || {};
        presetNameOrOptions = "default";
      }
    }

    this.options = {} as Preset["options"];
    this.configure(presetNameOrOptions as string);

    if (options) {
      this.set(options);
    }
  }

  /** chainable
   * MarkdownIt.set(options)
   *
   * Set parser options (in the same format as in constructor). Probably, you
   * will never need it, but you can change options after constructor call.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')()
   *             .set({ html: true, breaks: true })
   *             .set({ typographer, true });
   * ```
   *
   * __Note:__ To achieve the best possible performance, don't modify a
   * `markdown-it` instance options on the fly. If you need multiple configurations
   * it's best to create multiple instances and initialize each with separate
   * config.
   **/
  set(options: MarkdownItOptions) {
    Object.assign(this.options, options);
    return this;
  }

  /** chainable, internal
   * MarkdownIt.configure(presets)
   *
   * Batch load of all options and compenent settings. This is internal method,
   * and you probably will not need it. But if you will - see available presets
   * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/lib/presets)
   *
   * We strongly recommend to use presets instead of direct config loads. That
   * will give better compatibility with next versions.
   **/
  configure(presetsNameOrConfig?: string | Preset) {
    let preset: Preset | undefined;

    if (isString(presetsNameOrConfig)) {
      const presetName = presetsNameOrConfig;
      if (!isValidPresetName(presetName)) {
        throw new Error(
          'Wrong `markdown-it` preset "' + presetName + '", check name',
        );
      }
      preset = presets[presetName];
    } else {
      preset = presetsNameOrConfig;
    }

    if (!preset) {
      throw new Error("Wrong `markdown-it` preset, can't be empty");
    }

    if (preset.options) {
      this.set(preset.options);
    }

    if (preset.components) {
      (
        Object.keys(preset.components) as Array<"core" | "block" | "inline">
      ).forEach((name) => {
        if (preset.components[name].rules) {
          this[name].ruler.enableOnly(preset.components[name].rules);
        }
        if (name === "inline" && preset.components[name].rules2) {
          this[name].ruler2.enableOnly(preset.components[name].rules2);
        }
      });
    }
    return this;
  }

  /** chainable
   * MarkdownIt.enable(list, ignoreInvalid)
   * - list (String|Array): rule name or list of rule names to enable
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable list or rules. It will automatically find appropriate components,
   * containing rules with given names. If rule not found, and `ignoreInvalid`
   * not set - throws exception.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')()
   *             .enable(['sub', 'sup'])
   *             .disable('smartquotes');
   * ```
   **/
  enable(list: Array<string> | string, ignoreInvalid: boolean = false) {
    const result: Array<string> = [];

    if (!Array.isArray(list)) {
      list = [list];
    }

    (["core", "block", "inline"] as const).forEach((chain) => {
      result.push(...this[chain].ruler.enable(list, true));
    });

    result.push(...this.inline.ruler2.enable(list, true));

    const missed = list.some((name) => !result.includes(name));

    if (missed && !ignoreInvalid) {
      throw new Error(
        "MarkdownIt. Failed to enable unknown rule(s): " + missed,
      );
    }

    return this;
  }

  /** chainable
   * MarkdownIt.disable(list, ignoreInvalid)
   * - list (String|Array): rule name or list of rule names to disable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * The same as [[MarkdownIt.enable]], but turn specified rules off.
   **/
  disable(list: Array<string> | string, ignoreInvalid: boolean = false) {
    const result: Array<string> = [];

    if (!Array.isArray(list)) {
      list = [list];
    }

    (["core", "block", "inline"] as const).forEach((chain) => {
      result.push(...this[chain].ruler.disable(list, true));
    });

    result.push(...this.inline.ruler2.disable(list, true));

    const missed = list.some((name) => !result.includes(name));

    if (missed && !ignoreInvalid) {
      throw new Error(
        "MarkdownIt. Failed to disable unknown rule(s): " + missed,
      );
    }
    return this;
  }

  /** chainable
   * MarkdownIt.use(plugin, params)
   *
   * Load specified plugin with given params into current parser instance.
   * It's just a sugar to call `plugin(md, params)` with curring.
   *
   * ##### Example
   *
   * ```javascript
   * var iterator = require('markdown-it-for-inline');
   * var md = require('markdown-it')()
   *             .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
   *               tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar');
   *             });
   * ```
   **/
  use<Args extends unknown[]>(plugin: MarkdownItPlugin<Args>, ...args: Args) {
    // 异步顺序执行
    const allArgs = [this, ...args] as const;
    if (this.plugins.length === 0) {
      const promise = resolvePromiseLike(plugin.call(plugin, ...allArgs));
      this.plugins.push(promise);
    } else {
      const lastPlugin = this.plugins.at(-1)!;
      const promise = lastPlugin.then(() => plugin.call(plugin, ...allArgs));
      this.plugins.push(promise);
    }
    return this;
  }

  async isReady() {
    // 确保异步插件加载完毕
    await Promise.all(this.plugins);
  }

  /** internal
   * MarkdownIt.parse(src, env) -> Array
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * Parse input string and return list of block tokens (special token type
   * "inline" will contain list of inline tokens). You should not call this
   * method directly, until you write custom renderer (for example, to produce
   * AST).
   *
   * `env` is used to pass data between "distributed" rules and return additional
   * metadata like reference info, needed for the renderer. It also can be used to
   * inject data in specific cases. Usually, you will be ok to pass `{}`,
   * and then pass updated object to renderer.
   **/
  async parse(src: string, env: MarkdownItEnv = {}) {
    if (typeof src !== "string") {
      throw new Error("Input data should be a String");
    }

    const state = new StateCore(src, this, env);
    await this.core.process(state);

    return state.tokens;
  }

  /**
   * MarkdownIt.render(src [, env]) -> String
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * Render markdown string into html. It does all magic for you :).
   *
   * `env` can be used to inject additional metadata (`{}` by default).
   * But you will not need it with high probability. See also comment
   * in [[MarkdownIt.parse]].
   **/
  async render(src: string, env: MarkdownItEnv = {}) {
    return await this.renderer.render(
      await this.parse(src, env),
      this.options,
      env,
    );
  }

  /** internal
   * MarkdownIt.parseInline(src, env) -> Array
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * The same as [[MarkdownIt.parse]] but skip all block rules. It returns the
   * block tokens list with the single `inline` element, containing parsed inline
   * tokens in `children` property. Also updates `env` object.
   **/
  async parseInline(src: string, env: MarkdownItEnv = {}) {
    const state = new StateCore(src, this, env);

    state.inlineMode = true;
    await this.core.process(state);

    return state.tokens;
  }

  /**
   * MarkdownIt.renderInline(src [, env]) -> String
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * Similar to [[MarkdownIt.render]] but for single paragraph content. Result
   * will NOT be wrapped into `<p>` tags.
   **/
  async renderInline(src: string, env: MarkdownItEnv = {}) {
    return this.renderer.render(
      await this.parseInline(src, env),
      this.options,
      env,
    );
  }
}

export const createMarkdownIt = (
  presetNameOrOptions?: PresetName | MarkdownItOptions,
  options?: MarkdownItOptions,
) => {
  return new MarkdownIt(presetNameOrOptions, options);
};

export * from "./renderer";
export { default as Renderer } from "./renderer";
export * from "./ruler";
export { default as Ruler } from "./ruler";
export type {
  Delimiter,
  TokenMeta as StateInlineTokenMeta,
} from "./rules_inline/state_inline";
export * from "./token";
export { default as Token } from "./token";
