# markdown-it-enhancer

[![NPM version](https://img.shields.io/npm/v/markdown-it-enhancer.svg?style=flat)](https://www.npmjs.org/package/markdown-it-enhancer)
[![Coverage Status](https://coveralls.io/repos/Dedicatus546/markdown-it-enhancer/badge.svg?branch=main&service=github)](https://coveralls.io/github/Dedicatus546/markdown-it-enhancer?branch=main)

This is a fork from [markdown-it](https://github.com/markdown-it/markdown-it), there are some changes in this fork:

- ESM only
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
import MarkdownIt from "markdown-it-enchancer";

// delay s seconds.
const delay = (s) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, s * 1000);
  });
};

const md = MarkdownIt();

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
import MarkdownIt from "markdown-it-enchancer";

const md = MarkdownIt();

// set a async render rule.
md.renderer.rules.test = async (tokens, idx, options, env, renderer) => {
  // some async operation
  await delay(3);
  return "test";
};
```

## Async plugin

```javascript
import MarkdownIt from "markdown-it-enchancer";

const md = MarkdownIt();

md
  .use(async (arg1, arg2) => {
  // some async operation
    await delay(3);
  }, 'arg1', 'arg2')
  .use(async (arg1, arg2) => {
  // some async operation
    await delay(3);
  }, 'arg1', 'arg2')
  .use(async (arg1, arg2) => {
  // some async operation
    await delay(3);
  }, 'arg1', 'arg2');

// you must exec `await md.isReady()` to ensure the initializations of all plugins are success.
await md.isReady();
```

## Async `highlight` function

```javascript
import MarkdownIt from "markdown-it-enchancer";

const md = MarkdownIt({
  async highlight() {
    // async operation
    await delay(3);
    return "highlight function";
  }
});
```

## Others

### maxAutocompletedCells

Env support `maxAutocompletedCells` property. See [#1000](https://github.com/markdown-it/markdown-it/issues/1000)

```javascript
import MarkdownIt from "markdown-it-enchancer";

const md = MarkdownIt();

md.render('md content', {
  maxAutocompletedCells: 100
});
```
