# markdown-it-enhancer

[![NPM version](https://img.shields.io/npm/v/markdown-it-enhancer.svg?style=flat)](https://www.npmjs.org/package/markdown-it-enhancer)
[![Coverage Status](https://coveralls.io/repos/Dedicatus546/markdown-it-enhancer/badge.svg?branch=main&service=github)](https://coveralls.io/github/Dedicatus546/markdown-it-enhancer?branch=main)

This is a fork from [markdown-it](https://github.com/markdown-it/markdown-it), there are some changes in this fork:

- ESM only.
- Source code migrate to TypeScript, now you don't need to install `@types/markdown-it`.
- Using vite to bundle, vitest to test.
- Async support. include parser rule, render rule, plugins, `highlight` function.

## Install

```bash
npm install markdown-it-enchacer
# yarn add markdown-it-enchacer
# pnpm add markdown-it-enchacer
```

## Async Parser Rule

```javascript
import { MarkdownIt } from "markdown-it-enchancer";

// delay s seconds.
const delay = (s) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, s * 1000);
  });
};

const md = new MarkdownIt();

// push a async ruler
md.block.ruler.push(
  "async_rule",
  async (_state, _startLine, _endLine, _slient) => {
    // async operation
    await delay(3);
  },
);
```

## Async render rule

```javascript
import { MarkdownIt } from "markdown-it-enchancer";

// delay s seconds.
const delay = (s) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, s * 1000);
  });
};

const md = new MarkdownIt();

// set a async render rule.
md.renderer.rules.test = async (tokens, idx, options, env, renderer) => {
  // some async operation
  await delay(3);
  return "test";
};
```

## Async plugin

```javascript
import { MarkdownIt } from "markdown-it-enchancer";

// delay s seconds.
const delay = (s) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, s * 1000);
  });
};

const md = new MarkdownIt();

md
  .use(async (md, arg1, arg2) => {
  // some async operation
    await delay(3);
  }, 'arg1', 'arg2')
  .use(async (md, arg1, arg2) => {
  // some async operation
    await delay(3);
  }, 'arg1', 'arg2')
  .use(async (md, arg1, arg2) => {
  // some async operation
    await delay(3);
  }, 'arg1', 'arg2');

// you must exec `await md.isReady()` to ensure the initializations of all plugins are success.
await md.isReady();
```

## Async `highlight` function

```javascript
import { MarkdownIt } from "markdown-it-enchancer";

// delay s seconds.
const delay = (s) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, s * 1000);
  });
};

const md = new MarkdownIt({
  async highlight() {
    // async operation
    await delay(3);
    return "highlight function";
  }
});
```

## Others

### maxAutoCompletedCells

Env support `maxAutoCompletedCells` property. See [#1000](https://github.com/markdown-it/markdown-it/issues/1000)

```javascript
import { MarkdownIt } from "markdown-it-enchancer";

const md = new MarkdownIt();

md.render('md content', {
  maxAutoCompletedCells: 100
});
```

## Plugins

There are some plugins that migrate to markdown-it-enhancer.

- [markdown-it-katex](https://github.com/waylonflinn/markdown-it-katex) -> [markdown-it-katex-for-enhancer
](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/katex)
- [markdown-it-attrs](https://github.com/arve0/markdown-it-attrs) -> [markdown-it-attrs-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/attrs)
- [markdown-it-anchor](https://github.com/valeriangalliat/markdown-it-anchor) -> [markdown-it-anchor-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/anchor)
- [markdown-it-implicit-figures](https://github.com/arve0/markdown-it-implicit-figures) -> [markdown-it-implicit-figures-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/implicit-figures)
- [markdown-it-sup](https://github.com/markdown-it/markdown-it-sup) -> [markdown-it-sup-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/sup)
- [markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji) -> [markdown-it-emoji-for-enhancer
](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/emoji)
- [markdown-it-task-lists](https://github.com/revin/markdown-it-task-lists) -> [markdown-it-task-lists-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/task-lists)
- [markdown-it-container](https://github.com/markdown-it/markdown-it-container) -> [markdown-it-container-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/container)
- [markdown-it-sub](https://github.com/markdown-it/markdown-it-sub) -> [markdown-it-sub-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/sub)
- [markdown-it-abbr](https://github.com/markdown-it/markdown-it-abbr) -> [markdown-it-abbr-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/abbr)
- [markdown-it-for-inline](https://github.com/markdown-it/markdown-it-for-inline) -> [markdown-it-for-inline-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/for-inline)
- [markdown-it-deflist]() -> [markdown-it-deflist-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/deflist)
- [markdown-it-footnote]() -> [markdown-it-footnote-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/footnote)
- [markdown-it-ins]() -> [markdown-it-ins-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/ins)
- [markdown-it-mark]() -> [markdown-it-mark-for-enhancer](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugins/mark)

## Test Toolkit

- [markdown-it-testgen](https://github.com/markdown-it/markdown-it-testgen) -> [markdown-it-testgen-for-enhancer](https://github.com/Dedicatus546/markdown-it-testgen-for-enhancer)
