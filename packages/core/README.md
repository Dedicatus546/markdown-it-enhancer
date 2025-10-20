# @markdown-it-enhancer/core

[![NPM version](https://img.shields.io/npm/v/@markdown-it-enhancer/core.svg?style=flat)](https://www.npmjs.org/package/@markdown-it-enhancer/core)
[![Coverage Status](https://codecov.io/gh/Dedicatus546/markdown-it-enhancer/branch/main/graph/badge.svg?component=core)](https://app.codecov.io/github/Dedicatus546/markdown-it-enhancer/tree/main?components%5B0%5D=core)

This is a fork from [markdown-it](https://github.com/markdown-it/markdown-it), there are some changes in this fork:

- ESM only.
- Source code migrate to TypeScript, now you don't need to install `@types/markdown-it`.
- Async support. include parser rule, render rule, plugins, `highlight` function.

## Install

```bash
npm install @markdown-it-enchacer/core
# yarn add @markdown-it-enchacer/core
# pnpm add @markdown-it-enchacer/core
```

## Async Parser Rule

```javascript
import { MarkdownIt } from "@markdown-it-enchancer/core";

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
import { MarkdownIt } from "@markdown-it-enchancer/core";

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
import { MarkdownIt } from "@markdown-it-enchancer/core";

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
import { MarkdownIt } from "@markdown-it-enchancer/core";

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
import { MarkdownIt } from "@markdown-it-enchancer/core";

const md = new MarkdownIt();

md.render('md content', {
  maxAutoCompletedCells: 100
});
```

## Plugins

There are some plugins that migrate to markdown-it-enhancer.

- [markdown-it-katex](https://github.com/waylonflinn/markdown-it-katex) -> [@markdown-it-enhancer/plugin-katex](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-katex)
- [markdown-it-attrs](https://github.com/arve0/markdown-it-attrs) -> [@markdown-it-enhancer/plugin-attrs](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-attrs)
- [markdown-it-anchor](https://github.com/valeriangalliat/markdown-it-anchor) -> [@markdown-it-enhancer/plugin-anchor](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-anchor)
- [markdown-it-implicit-figures](https://github.com/arve0/markdown-it-implicit-figures) -> [@markdown-it-enhancer/plugin-implicit-figures](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-implicit-figures)
- [markdown-it-sup](https://github.com/markdown-it/markdown-it-sup) -> [@markdown-it-enhancer/plugin-sup](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-sup)
- [markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji) -> [@markdown-it-enhancer/plugin-emoji](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-emoji)
- [markdown-it-task-lists](https://github.com/revin/markdown-it-task-lists) -> [@markdown-it-enhancer/plugin-task-lists](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-task-lists)
- [markdown-it-container](https://github.com/markdown-it/markdown-it-container) -> [@markdown-it-enhancer/plugin-container](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-container)
- [markdown-it-sub](https://github.com/markdown-it/markdown-it-sub) -> [@markdown-it-enhancer/plugin-sub](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-sub)
- [markdown-it-abbr](https://github.com/markdown-it/markdown-it-abbr) -> [@markdown-it-enhancer/plugin-abbr](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-abbr)
- [markdown-it-for-inline](https://github.com/markdown-it/markdown-it-for-inline) -> [@markdown-it-enhancer/plugin-for-inline](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-for-inline)
- [markdown-it-deflist](https://github.com/markdown-it/markdown-it-deflist) -> [@markdown-it-enhancer/plugin-deflist](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-deflist)
- [markdown-it-footnote](https://github.com/markdown-it/markdown-it-footnote) -> [@markdown-it-enhancer/plugin-footnote](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-footnote)
- [markdown-it-ins](https://github.com/markdown-it/markdown-it-ins) -> [@markdown-it-enhancer/plugin-ins](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-ins)
- [markdown-it-mark](https://github.com/markdown-it/markdown-it-mark) -> [@markdown-it-enhancer/plugin-mark](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-mark)
- [markdown-it-link-attributes](https://github.com/crookedneighbor/markdown-it-link-attributes) -> [@markdown-it-enhancer/plugin-link-attributes](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-link-attributes)
- [markdown-it-magic-link](https://github.com/antfu/markdown-it-magic-link) -> [@markdown-it-enhancer/plugin-magic-link](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-magic-link)
- [markdown-it-table-of-contents](https://github.com/cmaas/markdown-it-table-of-contents) -> [@markdown-it-enhancer/plugin-table-of-contents](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/plugin-table-of-contents)

## Test Toolkit

- [markdown-it-testgen](https://github.com/markdown-it/markdown-it-testgen) -> [@markdown-it-enhancer/test-toolkit](https://github.com/Dedicatus546/markdown-it-enhancer/tree/main/packages/test-toolkit)
