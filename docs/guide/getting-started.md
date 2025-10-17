# Getting Started

<!-- ## Try It Online

You can try Markdown-It-Enhancer directly in your browser on [StackBlitz](https://vitepress.new).

## Installation -->

### Prerequisites

- [Node.js](https://nodejs.org/) version 20 or higher.

You can install it with:

::: code-group

```sh [npm]
$ npm add markdown-it-enhancer
```

```sh [pnpm]
$ pnpm add markdown-it-enhancer
```

```sh [yarn]
$ yarn add markdown-it-enhancer
```

:::

::: tip NOTE

Markdown-It-Enhancer is an ESM-only package. Don't use `require()` to import it, and make sure your nearest `package.json` contains `"type": "module"`.

:::

## Usage

```typescript
import { MarkdownIt } from "markdown-it-enhancer";

const md = new MarkdownIt();

const result = await md.render('# h1\nHello world!');
```

