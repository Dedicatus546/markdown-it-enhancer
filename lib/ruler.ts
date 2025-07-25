import StateBlock from "./rules_block/state_block";
import StateCore from "./rules_core/state_core";
import StateInline from "./rules_inline/state_inline";
import { Awaitable } from "./types";

export interface Rule<T> {
  name: string;
  enabled: boolean;
  fn: RuleFn<T>;
  alt: Array<string>;
}

export type RuleResult = undefined | void | boolean;

export interface StateBlockRuleFn {
  (
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent?: boolean,
  ): Awaitable<RuleResult>;
}

export interface StateInlineRuleFn {
  (state: StateInline, silent?: boolean): Awaitable<RuleResult>;
}

export type RuleFn<T> = T extends StateBlock
  ? StateBlockRuleFn
  : T extends StateInline
    ? StateInlineRuleFn
    : T extends StateCore
      ? (state: T) => Awaitable<RuleResult>
      : () => Awaitable<void>;

/**
 * class Ruler
 *
 * Helper class, used by [[MarkdownIt#core]], [[MarkdownIt#block]] and
 * [[MarkdownIt#inline]] to manage sequences of functions (rules):
 *
 * - keep rules in defined order
 * - assign the name to each rule
 * - enable/disable rules
 * - add/replace rules
 * - allow assign rules to additional named chains (in the same)
 * - cacheing lists of active rules
 *
 * You will not need use this class directly until write plugins. For simple
 * rules control use [[MarkdownIt.disable]], [[MarkdownIt.enable]] and
 * [[MarkdownIt.use]].
 **/
class Ruler<T> {
  // List of added rules. Each element is:
  //
  // {
  //   name: XXX,
  //   enabled: Boolean,
  //   fn: Function(),
  //   alt: [ name2, name3 ]
  // }
  #rules: Array<Rule<T>> = [];

  // Cached rule chains.
  //
  // First level - chain name, '' for default.
  // Second level - diginal anchor for fast filtering by charcodes.
  #cache: Record<string, Array<RuleFn<T>>> | null = null;

  // Helper methods, should not be used directly

  // Find rule index by name
  #find(name: string) {
    for (let i = 0; i < this.#rules.length; i++) {
      if (this.#rules[i].name === name) {
        return i;
      }
    }
    return -1;
  }

  // Build rules lookup cache
  #compile() {
    const chains = [""];

    // collect unique names
    this.#rules.forEach((rule) => {
      if (!rule.enabled) {
        return;
      }

      rule.alt.forEach((altName) => {
        if (chains.indexOf(altName) < 0) {
          chains.push(altName);
        }
      });
    });

    this.#cache = {};

    chains.forEach((chain) => {
      this.#cache![chain] = [];
      this.#rules.forEach((rule) => {
        if (!rule.enabled) {
          return;
        }

        if (chain && rule.alt.indexOf(chain) < 0) {
          return;
        }

        this.#cache![chain].push(rule.fn);
      });
    });
  }

  /**
   * Ruler.at(name, fn [, options])
   * - name (String): rule name to replace.
   * - fn (Function): new rule function.
   * - options (Object): new rule options (not mandatory).
   *
   * Replace rule by name with new function & options. Throws error if name not
   * found.
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * Replace existing typographer replacement rule with new one:
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.core.ruler.at('replacements', function replace(state) {
   *   //...
   * });
   * ```
   **/
  at(name: string, fn: RuleFn<T>, options?: Partial<Pick<Rule<T>, "alt">>) {
    const index = this.#find(name);
    const opt = options || {};

    if (index === -1) {
      throw new Error("Parser rule not found: " + name);
    }

    this.#rules[index].fn = fn;
    this.#rules[index].alt = opt.alt || [];
    this.#cache = null;
  }

  /**
   * Ruler.before(beforeName, ruleName, fn [, options])
   * - beforeName (String): new rule will be added before this one.
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Add new rule to chain before one with given name. See also
   * [[Ruler.after]], [[Ruler.push]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  before(
    beforeName: string,
    ruleName: string,
    fn: RuleFn<T>,
    options?: Partial<Pick<Rule<T>, "alt">>,
  ) {
    const index = this.#find(beforeName);
    const opt = options || {};

    if (index === -1) {
      throw new Error("Parser rule not found: " + beforeName);
    }

    this.#rules.splice(index, 0, {
      name: ruleName,
      enabled: true,
      fn,
      alt: opt.alt || [],
    });

    this.#cache = null;
  }

  /**
   * Ruler.after(afterName, ruleName, fn [, options])
   * - afterName (String): new rule will be added after this one.
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Add new rule to chain after one with given name. See also
   * [[Ruler.before]], [[Ruler.push]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.inline.ruler.after('text', 'my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  after(
    afterName: string,
    ruleName: string,
    fn: RuleFn<T>,
    options?: Partial<Pick<Rule<T>, "alt">>,
  ) {
    const index = this.#find(afterName);
    const opt = options || {};

    if (index === -1) {
      throw new Error("Parser rule not found: " + afterName);
    }

    this.#rules.splice(index + 1, 0, {
      name: ruleName,
      enabled: true,
      fn,
      alt: opt.alt || [],
    });

    this.#cache = null;
  }

  /**
   * Ruler.push(ruleName, fn [, options])
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Push new rule to the end of chain. See also
   * [[Ruler.before]], [[Ruler.after]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.core.ruler.push('my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  push(
    ruleName: string,
    fn: RuleFn<T>,
    options?: Partial<Pick<Rule<T>, "alt">>,
  ) {
    const opt = options || {};

    this.#rules.push({
      name: ruleName,
      enabled: true,
      fn,
      alt: opt.alt || [],
    });

    this.#cache = null;
  }

  /**
   * Ruler.enable(list [, ignoreInvalid]) -> Array
   * - list (String|Array): list of rule names to enable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * Returns list of found rule names (if no exception happened).
   *
   * See also [[Ruler.disable]], [[Ruler.enableOnly]].
   **/
  enable(list: Array<string> | string, ignoreInvalid: boolean = false) {
    if (!Array.isArray(list)) {
      list = [list];
    }

    const result: Array<string> = [];

    // Search by name and enable
    list.forEach((name) => {
      const idx = this.#find(name);

      if (idx < 0) {
        if (ignoreInvalid) {
          return;
        }
        throw new Error("Rules manager: invalid rule name " + name);
      }
      this.#rules[idx].enabled = true;
      result.push(name);
    }, this);

    this.#cache = null;
    return result;
  }

  /**
   * Ruler.enableOnly(list [, ignoreInvalid])
   * - list (String|Array): list of rule names to enable (whitelist).
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable rules with given names, and disable everything else. If any rule name
   * not found - throw Error. Errors can be disabled by second param.
   *
   * See also [[Ruler.disable]], [[Ruler.enable]].
   **/
  enableOnly(list: Array<string> | string, ignoreInvalid: boolean = false) {
    if (!Array.isArray(list)) {
      list = [list];
    }

    this.#rules.forEach(function (rule) {
      rule.enabled = false;
    });

    this.enable(list, ignoreInvalid);
  }

  /**
   * Ruler.disable(list [, ignoreInvalid]) -> Array
   * - list (String|Array): list of rule names to disable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Disable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * Returns list of found rule names (if no exception happened).
   *
   * See also [[Ruler.enable]], [[Ruler.enableOnly]].
   **/
  disable(list: Array<string> | string, ignoreInvalid: boolean = false) {
    if (!Array.isArray(list)) {
      list = [list];
    }

    const result: Array<string> = [];

    // Search by name and disable
    list.forEach((name) => {
      const idx = this.#find(name);

      if (idx < 0) {
        if (ignoreInvalid) {
          return;
        }
        throw new Error("Rules manager: invalid rule name " + name);
      }
      this.#rules[idx].enabled = false;
      result.push(name);
    }, this);

    this.#cache = null;
    return result;
  }

  /**
   * Ruler.getRules(chainName) -> Array
   *
   * Return array of active functions (rules) for given chain name. It analyzes
   * rules configuration, compiles caches if not exists and returns result.
   *
   * Default chain name is `''` (empty string). It can't be skipped. That's
   * done intentionally, to keep signature monomorphic for high speed.
   **/
  getRules(chainName: string) {
    if (this.#cache === null) {
      this.#compile();
    }

    // Chain can be empty, if rules disabled. But we still have to return Array.
    return this.#cache![chainName] || [];
  }
}

export default Ruler;
