import {
  escapeRE,
  isFunction,
  isObject,
  isRegExp,
  isString,
} from "markdown-it-enhancer-utils";

import { defaultOptions, defaultSchemas, tlds_2ch_src_re } from "./constants";
import { Match } from "./match";
import { createRegExp } from "./re";
import type {
  LinkifyItNormalizedOptions,
  LinkifyItNormalizedSchemas,
  LinkifyItOptions,
  LinkifyItRegExp,
  LinkifyItSchemas,
  LinkifyItSchemasObject,
} from "./types";
import { isOptionsObj } from "./utils";

/**
 * new LinkifyIt(schemas, options)
 * - schemas (Object): Optional. Additional schemas to validate (prefix/validator)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Creates new linkifier instance with optional additional schemas.
 * Can be called without `new` keyword for convenience.
 *
 * By default understands:
 *
 * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
 * - "fuzzy" links and emails (example.com, foo@bar.com).
 *
 * `schemas` is an object, where each key/value describes protocol/rule:
 *
 * - __key__ - link prefix (usually, protocol name with `:` at the end, `skype:`
 *   for example). `linkify-it` makes shure that prefix is not preceeded with
 *   alphanumeric char and symbols. Only whitespaces and punctuation allowed.
 * - __value__ - rule to check tail after link prefix
 *   - _String_ - just alias to existing rule
 *   - _Object_
 *     - _validate_ - validator function (should return matched length on success),
 *       or `RegExp`.
 *     - _normalize_ - optional function to normalize text & url of matched result
 *       (for example, for @twitter mentions).
 *
 * `options`:
 *
 * - __fuzzyLink__ - recognige URL-s without `http(s):` prefix. Default `true`.
 * - __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
 *   like version numbers. Default `false`.
 * - __fuzzyEmail__ - recognize emails without `mailto:` prefix.
 *
 **/
export class LinkifyIt {
  __opts__: LinkifyItNormalizedOptions;

  // Cache last tested result. Used to skip repeating steps on next `match` call.
  __index__ = -1;
  // Next scan position
  __last_index__ = -1;

  __schema__ = "";
  __text_cache__ = "";

  __schemas__: LinkifyItSchemas;
  __compiled__: LinkifyItNormalizedSchemas = {};

  __tlds__;
  __tlds_replaced__ = false;

  re: LinkifyItRegExp;

  constructor(
    schemas?: LinkifyItSchemas | LinkifyItOptions,
    options?: LinkifyItOptions,
  ) {
    if (!options) {
      if (isOptionsObj(schemas)) {
        options = schemas;
        schemas = {};
      }
    }

    this.__opts__ = Object.assign({}, defaultOptions, options);

    this.__schemas__ = Object.assign({}, defaultSchemas, schemas);

    // DON'T try to make PRs with changes. Extend TLDs with LinkifyIt.tlds() instead
    this.__tlds__
      = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split(
        "|",
      );

    this.re = {} as LinkifyItRegExp;

    this.#compile();
  }

  /** chainable
   * LinkifyIt#add(schema, definition)
   * - schema (String): rule name (fixed pattern prefix)
   * - definition (String|RegExp|Object): schema definition
   *
   * Add new rule definition. See constructor description for details.
   **/
  // 这里联合类型 LinkifyItSchemas[string] 会干扰 typescript 对 normalize 参数判断，需要使用函数重载
  add(schema: string, definition: string): this;
  add(schema: string, definition: LinkifyItSchemasObject): this;
  add(schema: string, definition: LinkifyItSchemas[string]) {
    this.__schemas__[schema] = definition;
    this.#compile();
    return this;
  }

  /** chainable
   * LinkifyIt#set(options)
   * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
   *
   * Set recognition options for links without schema.
   **/
  set(options: LinkifyItOptions) {
    this.__opts__ = Object.assign(this.__opts__, options);
    return this;
  }

  /**
   * LinkifyIt#test(text) -> Boolean
   *
   * Searches linkifiable pattern and returns `true` on success or `false` on fail.
   **/
  test(text: string) {
    // Reset scan cache
    this.__text_cache__ = text;
    this.__index__ = -1;

    if (!text.length) {
      return false;
    }

    let m, ml, me, len, shift, next, re, tld_pos, at_pos;

    // try to scan for link with schema - that's the most simple rule
    if (this.re.schema_test.test(text)) {
      re = this.re.schema_search;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        len = this.testSchemaAt(text, m[2], re.lastIndex);
        if (len) {
          this.__schema__ = m[2];
          this.__index__ = m.index + m[1].length;
          this.__last_index__ = m.index + m[0].length + len;
          break;
        }
      }
    }

    if (this.__opts__.fuzzyLink && this.__compiled__["http:"]) {
      // guess schemaless links
      tld_pos = text.search(this.re.host_fuzzy_test);
      if (tld_pos >= 0) {
        // if tld is located after found link - no need to check fuzzy pattern
        if (this.__index__ < 0 || tld_pos < this.__index__) {
          if (
            (ml = text.match(
              this.__opts__.fuzzyIP
                ? this.re.link_fuzzy
                : this.re.link_no_ip_fuzzy,
            )) !== null
          ) {
            shift = ml.index! + ml[1].length;

            if (this.__index__ < 0 || shift < this.__index__) {
              this.__schema__ = "";
              this.__index__ = shift;
              this.__last_index__ = ml.index! + ml[0].length;
            }
          }
        }
      }
    }

    if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"]) {
      // guess schemaless emails
      at_pos = text.indexOf("@");
      if (at_pos >= 0) {
        // We can't skip this check, because this cases are possible:
        // 192.168.1.1@gmail.com, my.in@example.com
        if ((me = text.match(this.re.email_fuzzy)) !== null) {
          shift = me.index! + me[1].length;
          next = me.index! + me[0].length;

          if (
            this.__index__ < 0
            || shift < this.__index__
            || (shift === this.__index__ && next > this.__last_index__)
          ) {
            this.__schema__ = "mailto:";
            this.__index__ = shift;
            this.__last_index__ = next;
          }
        }
      }
    }

    return this.__index__ >= 0;
  }

  /**
   * LinkifyIt#pretest(text) -> Boolean
   *
   * Very quick check, that can give false positives. Returns true if link MAY BE
   * can exists. Can be used for speed optimization, when you need to check that
   * link NOT exists.
   **/
  pretest(text: string) {
    return this.re.pretest.test(text);
  }

  /**
   * LinkifyIt#testSchemaAt(text, name, position) -> Number
   * - text (String): text to scan
   * - name (String): rule (schema) name
   * - position (Number): text offset to check from
   *
   * Similar to [[LinkifyIt#test]] but checks only specific protocol tail exactly
   * at given position. Returns length of found pattern (0 on fail).
   **/
  testSchemaAt(text: string, schema: string, pos: number) {
    // If not supported schema check requested - terminate
    if (!this.__compiled__[schema.toLowerCase()]) {
      return 0;
    }
    return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
  }

  /**
   * LinkifyIt#match(text) -> Array|null
   *
   * Returns array of found link descriptions or `null` on fail. We strongly
   * recommend to use [[LinkifyIt#test]] first, for best speed.
   *
   * ##### Result match description
   *
   * - __schema__ - link schema, can be empty for fuzzy links, or `//` for
   *   protocol-neutral  links.
   * - __index__ - offset of matched text
   * - __lastIndex__ - index of next char after mathch end
   * - __raw__ - matched text
   * - __text__ - normalized text
   * - __url__ - link, generated from matched text
   **/
  match(text: string) {
    const result = [];
    let shift = 0;

    // Try to take previous element from cache, if .test() called before
    if (this.__index__ >= 0 && this.__text_cache__ === text) {
      result.push(this.#createMatch(shift));
      shift = this.__last_index__;
    }

    // Cut head if cache was used
    let tail = shift ? text.slice(shift) : text;

    // Scan string until end reached
    while (this.test(tail)) {
      result.push(this.#createMatch(shift));

      tail = tail.slice(this.__last_index__);
      shift += this.__last_index__;
    }

    if (result.length) {
      return result;
    }

    return null;
  }

  /**
   * LinkifyIt#matchAtStart(text) -> Match|null
   *
   * Returns fully-formed (not fuzzy) link if it starts at the beginning
   * of the string, and null otherwise.
   **/
  matchAtStart(text: string) {
    // Reset scan cache
    this.__text_cache__ = text;
    this.__index__ = -1;

    if (!text.length) {
      return null;
    }

    const m = this.re.schema_at_start.exec(text);
    if (!m) {
      return null;
    }

    const len = this.testSchemaAt(text, m[2], m[0].length);
    if (!len) {
      return null;
    }

    this.__schema__ = m[2];
    this.__index__ = m.index + m[1].length;
    this.__last_index__ = m.index + m[0].length + len;

    return this.#createMatch(0);
  }

  /** chainable
   * LinkifyIt#tlds(list [, keepOld]) -> this
   * - list (Array): list of tlds
   * - keepOld (Boolean): merge with current list if `true` (`false` by default)
   *
   * Load (or merge) new tlds list. Those are user for fuzzy links (without prefix)
   * to avoid false positives. By default this algorythm used:
   *
   * - hostname with any 2-letter root zones are ok.
   * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
   *   are ok.
   * - encoded (`xn--...`) root zones are ok.
   *
   * If list is replaced, then exact match for 2-chars root zones will be checked.
   **/
  tlds(list: Array<string> | string, keepOld: boolean = false) {
    list = Array.isArray(list) ? list : [list];

    if (!keepOld) {
      this.__tlds__ = list.slice();
      this.__tlds_replaced__ = true;
      this.#compile();
      return this;
    }

    this.__tlds__ = this.__tlds__
      .concat(list)
      .sort()
      .filter(function (el, idx, arr) {
        return el !== arr[idx - 1];
      })
      .reverse();

    this.#compile();
    return this;
  }

  /**
   * LinkifyIt#normalize(match)
   *
   * Default normalizer (if schema does not define it's own).
   **/
  normalize(match: Match) {
    // Do minimal possible changes by default. Need to collect feedback prior
    // to move forward https://github.com/markdown-it/linkify-it/issues/1

    if (!match.schema) {
      match.url = "http://" + match.url;
    }

    if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) {
      match.url = "mailto:" + match.url;
    }
  }

  /**
   * LinkifyIt#onCompile()
   *
   * Override to modify basic RegExp-s.
   **/
  onCompile() {}

  // Schemas compiler. Build regexps.
  //
  #compile() {
    // Load & clone RE patterns.
    const re = (this.re = createRegExp(this.__opts__) as LinkifyItRegExp);

    // Define dynamic patterns
    const tlds = this.__tlds__.slice();

    this.onCompile();

    if (!this.__tlds_replaced__) {
      tlds.push(tlds_2ch_src_re);
    }
    tlds.push(re.src_xn);

    re.src_tlds = tlds.join("|");

    const untpl = (tpl: string) => {
      return tpl.replace("%TLDS%", re.src_tlds);
    };

    re.email_fuzzy = RegExp(untpl(re.tpl_email_fuzzy), "i");
    re.link_fuzzy = RegExp(untpl(re.tpl_link_fuzzy), "i");
    re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), "i");
    re.host_fuzzy_test = RegExp(untpl(re.tpl_host_fuzzy_test), "i");

    //
    // Compile each schema
    //

    const aliases: Array<string> = [];

    this.__compiled__ = {}; // Reset compiled data

    const schemaError = (name: string, val: unknown) => {
      throw new Error(
        "(LinkifyIt) Invalid schema \"" + name + "\": " + String(val),
      );
    };

    Object.keys(this.__schemas__).forEach((name) => {
      const val = this.__schemas__[name];

      // skip disabled methods
      if (val === null) {
        return;
      }

      const compiled = {} as LinkifyItNormalizedSchemas[string];

      this.__compiled__[name] = compiled;

      if (isObject(val)) {
        if (isRegExp(val.validate)) {
          compiled.validate = this.#createValidator(val.validate);
        }
        else if (isFunction(val.validate)) {
          compiled.validate = val.validate;
        }
        else {
          schemaError(name, val);
        }

        if (isFunction(val.normalize)) {
          compiled.normalize = val.normalize;
        }
        else if (!val.normalize) {
          compiled.normalize = this.#createNormalizer();
        }
        else {
          schemaError(name, val);
        }

        return;
      }

      if (isString(val)) {
        aliases.push(name);
        return;
      }

      schemaError(name, val);
    });

    //
    // Compile postponed aliases
    //

    aliases.forEach((alias) => {
      const aliasTarget = this.__schemas__[alias] as string;
      if (!this.__compiled__[aliasTarget]) {
        // Silently fail on missed schemas to avoid errons on disable.
        // schemaError(alias, this.__schemas__[alias]);
        return;
      }

      this.__compiled__[alias].validate
        = this.__compiled__[aliasTarget].validate;
      this.__compiled__[alias].normalize
        = this.__compiled__[aliasTarget].normalize;
    });

    //
    // Fake record for guessed links
    //
    this.__compiled__[""] = {
      // TODO fix
      // validate: null,
      validate: () => 0,
      normalize: this.#createNormalizer(),
    };

    //
    // Build schema condition
    //
    const slist = Object.keys(this.__compiled__)
      .filter((name) => {
        // Filter disabled & fake schemas
        return name.length > 0 && this.__compiled__[name];
      })
      .map(escapeRE)
      .join("|");
    // (?!_) cause 1.5x slowdown
    this.re.schema_test = RegExp(
      "(^|(?!_)(?:[><\uff5c]|" + re.src_ZPCc + "))(" + slist + ")",
      "i",
    );
    this.re.schema_search = RegExp(
      "(^|(?!_)(?:[><\uff5c]|" + re.src_ZPCc + "))(" + slist + ")",
      "ig",
    );
    this.re.schema_at_start = RegExp("^" + this.re.schema_search.source, "i");

    this.re.pretest = RegExp(
      "("
      + this.re.schema_test.source
      + ")|("
      + this.re.host_fuzzy_test.source
      + ")|@",
      "i",
    );

    //
    // Cleanup
    //
    this.#resetScanCache();
  }

  #resetScanCache() {
    this.__index__ = -1;
    this.__text_cache__ = "";
  }

  #createValidator(re: RegExp) {
    return (text: string, pos: number) => {
      const tail = text.slice(pos);

      if (re.test(tail)) {
        return tail.match(re)?.[0].length ?? 0;
      }
      return 0;
    };
  }

  #createNormalizer() {
    return (match: Match, linkifyIt: LinkifyIt) => {
      linkifyIt.normalize(match);
    };
  }

  #createMatch(shift: number) {
    const match = new Match(this, shift);
    this.__compiled__[match.schema].normalize(match, this);
    return match;
  }
}
