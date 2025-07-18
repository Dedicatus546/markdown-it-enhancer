// Main parser class

import LinkifyIt from "linkify-it";
import * as mdurl from "mdurl";
import punycode from "punycode.js";

import * as utils from "./common/utils";
import { assign, isString } from "./common/utils";
import * as helpers from "./helpers/index";
import ParserBlock from "./parser_block";
import ParserCore from "./parser_core";
import ParserInline from "./parser_inline";
import cfg_commonmark from "./presets/commonmark";
import cfg_default from "./presets/default";
import cfg_zero from "./presets/zero";
import Renderer from "./renderer";

const config = {
  default: cfg_default,
  zero: cfg_zero,
  commonmark: cfg_commonmark,
};

//
// This validator can prohibit more than really needed to prevent XSS. It's a
// tradeoff to keep code simple and to be secure by default.
//
// If you need different setup - override validator method as you wish. Or
// replace it with dummy function and use external sanitizer.
//

const BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
const GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

function validateLink(url: string) {
  // url should be normalized at this point, and existing entities are decoded
  const str = url.trim().toLowerCase();

  return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
}

const RECODE_HOSTNAME_FOR = ["http:", "https:", "mailto:"] as const;

function normalizeLink(url: string) {
  const parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toASCII(parsed.hostname);
      } catch {
        /**/
      }
    }
  }

  return mdurl.encode(mdurl.format(parsed));
}

function normalizeLinkText(url: string) {
  const parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toUnicode(parsed.hostname);
      } catch {
        /**/
      }
    }
  }

  // add '%' to exclude list because of https://github.com/markdown-it/markdown-it/issues/720
  return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + "%");
}

/**
 * class MarkdownIt
 *
 * Main parser/renderer class.
 *
 * ##### Usage
 *
 * ```javascript
 * // node.js, "classic" way:
 * var MarkdownIt = require('markdown-it'),
 *     md = new MarkdownIt();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // node.js, the same, but with sugar:
 * var md = require('markdown-it')();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // browser without AMD, added to "window" on script load
 * // Note, there are no dash.
 * var md = window.markdownit();
 * var result = md.render('# markdown-it rulezz!');
 * ```
 *
 * Single line rendering, without paragraph wrap:
 *
 * ```javascript
 * var md = require('markdown-it')();
 * var result = md.renderInline('__markdown-it__ rulezz!');
 * ```
 **/

type PresetName = "default" | "commonmark" | "zero";

export type MarkdownItOptions = {
  html?: boolean;
  xhtmlOut?: boolean;
  breaks?: boolean;
  langPrefix?: string;
  linkify?: boolean;
  typographer?: boolean;
  quotes?: string;
  highlight?: (str: string, lang: string, langAttrs: unknown) => string;
};

class MarkdownIt {
  inline = new ParserInline();
  block = new ParserBlock();
  core = new ParserCore();
  renderer = new Renderer();
  linkify = new LinkifyIt();
  validateLink = validateLink;
  normalizeLink = normalizeLink;
  normalizeLinkText = normalizeLinkText;
  utils = utils;
  helpers = assign({}, helpers);
  options: MarkdownItOptions = {};

  constructor(
    presetNameOrOptions: PresetName | MarkdownItOptions,
    options?: MarkdownItOptions,
  ) {
    let presetName = "default";

    if (!options) {
      if (!isString(presetNameOrOptions)) {
        options = presetName || {};
        presetName = "default";
      }
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
  set(options) {
    assign(this.options, options);
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
  configure(presets) {
    if (isString(presets)) {
      const presetName = presets;
      presets = config[presetName];
      if (!presets) {
        throw new Error(
          'Wrong `markdown-it` preset "' + presetName + '", check name',
        );
      }
    }

    if (!presets) {
      throw new Error("Wrong `markdown-it` preset, can't be empty");
    }

    if (presets.options) {
      this.set(presets.options);
    }

    if (presets.components) {
      Object.keys(presets.components).forEach((name) => {
        if (presets.components[name].rules) {
          this[name].ruler.enableOnly(presets.components[name].rules);
        }
        if (presets.components[name].rules2) {
          this[name].ruler2.enableOnly(presets.components[name].rules2);
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
  enable(list, ignoreInvalid) {
    let result = [];

    if (!Array.isArray(list)) {
      list = [list];
    }

    ["core", "block", "inline"].forEach(function (chain) {
      result = result.concat(this[chain].ruler.enable(list, true));
    }, this);

    result = result.concat(this.inline.ruler2.enable(list, true));

    const missed = list.filter(function (name) {
      return result.indexOf(name) < 0;
    });

    if (missed.length && !ignoreInvalid) {
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
  disable(list, ignoreInvalid) {
    let result = [];

    if (!Array.isArray(list)) {
      list = [list];
    }

    ["core", "block", "inline"].forEach(function (chain) {
      result = result.concat(this[chain].ruler.disable(list, true));
    }, this);

    result = result.concat(this.inline.ruler2.disable(list, true));

    const missed = list.filter(function (name) {
      return result.indexOf(name) < 0;
    });

    if (missed.length && !ignoreInvalid) {
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
  use(plugin /*, params, ... */) {
    const args = [this].concat(Array.prototype.slice.call(arguments, 1));
    plugin.apply(plugin, args);
    return this;
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
  parse(src, env) {
    if (typeof src !== "string") {
      throw new Error("Input data should be a String");
    }

    const state = new this.core.State(src, this, env);

    this.core.process(state);

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
  render(src, env) {
    env = env || {};
    return this.renderer.render(this.parse(src, env), this.options, env);
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
  parseInline(src, env) {
    const state = new this.core.State(src, this, env);

    state.inlineMode = true;
    this.core.process(state);

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
  renderInline(src, env) {
    env = env || {};

    return this.renderer.render(this.parseInline(src, env), this.options, env);
  }
}

export default MarkdownIt;
