# Breaking Change

There are some breaking change in Markdown-It-Enhancer. If you want to migrate your plugin to Markdown-It-Enhancer, you would have better to know these differences.

## Plugin Init

In Markdown-It, plugin's initialization is sync, but in Markdown-It-Enhancer, you must call `MarkdownIt.prototype.isReady` to ensure that async plugin's initialization has been completed.

```typescript
import { MarkdownIt } from "markdown-it-enhancer";
import { anchor } from "markdown-it-anchor-for-enahncer";

const md = new MarkdownIt();

md.use(anchor);

await md.isReady();

// anchor is initialized completely

const result = await md.render('# h1\nHello world!');
```

`MarkdownIt.prototype.use` would return itself, so you could call `MarkdownIt.prototype.isReady` by chain style.

```typescript
import { MarkdownIt } from "markdown-it-enhancer";
import { anchor } from "markdown-it-anchor-for-enahncer";

const md = new MarkdownIt();

await md.use(anchor).isReady();

// anchor is initialized completely

const result = await md.render('# h1\nHello world!');
```

you could call `MarkdownIt.prototype.use` repeatedly. Just remember that call `MarkdownIt.prototype.use` and then call `MarkdownIt.prototype.isReady`

## Async or Sync Parser Rule

In Markdown-It, parser rule is sync, but in Markdown-It-Enhancer, it could be async or sync.

```typescript
import { MarkdownIt } from "markdown-it-enhancer";

const md = new MarkdownIt();

md.block.ruler.before("reference", "b_rule", async (state, startLine, _endLine, silent) => {
  // async support
});

md.core.ruler.after("linkify", "c_rule", async (state) => {
  // async support
});

md.inline.ruler.before("emphasis", "i_rule", async (state, silent) => {
  // async support
});
```

You could check [StateBlockRuleFn](), [StateInlineRuleFn]() and [StateCoreRuleFn]() to find out the detail of type definition.

## Async or Sync Renderer Rule

In Markdown-It, renderer rule is sync, but in Markdown-It-Enhancer, it could be async or sync.

```typescript
import { MarkdownIt, type RendererFn } from "markdown-it-enhancer";

const md = new MarkdownIt();

// Extend RendererExtendsRules so we could get a correct type hint.
declare module "markdown-it-enhancer" {
  interface RendererExtendsRules {
    test: RendererFn
  }
}

md.renderer.rules.test = async (tokens, idx, options, env, renderer) => {
  // async support
};
```

In Markdown-it-enhancer, there are some built-in renderer rule. You could check [RendererDefaultRules]().

## Async Highlight Function

<!-- TODO -->

In Markdown-It, the config `highlight` is sync, but in Markdown-It-Enhancer, it could be async or sync.

```typescript
import { MarkdownIt } from "markdown-it-enhancer";

const md = new MarkdownIt({
  async highlight() {
    // async support
  }
});
```

## Async methods

There are some api that change to async.

- MarkdownIt.prototype.parse
- MarkdownIt.prototype.render
- MarkdownIt.prototype.parseInline
- MarkdownIt.prototype.renderInline
- ParserCore.prototype.process
- ParserBlock.prototype.tokenize
- ParserBlock.prototype.parse
- ParserInline.prototype.skipToken
- ParserInline.prototype.tokenize
- ParserInline.prototype.parse
- Renderer.prototype.renderInline
- Renderer.prototype.render
- parseLinkLabel

If your plugin use these api, you should migrate it to async implementation.

You could check [Write a type safety plugin in markdown-it-enhancer]().
