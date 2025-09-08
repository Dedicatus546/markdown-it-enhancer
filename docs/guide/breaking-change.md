# Breaking Change

There are some breaking change in Markdown-It-Enhancer. If you want to migrate your plugin to Markdown-It-Enhancer, you would have better to know these differences.

## Plugin Init

In Markdown-It, plugin's initialization is sync, but in Markdown-It-Enhancer, you must call `MarkdownItEnhancer.prototype.isReady` to ensure that plugin's initialization has been completed.

```typescript
import { MarkdownIt } from "markdown-it-enhancer";
import { anchor } from "markdown-it-anchor-for-enahncer";

const md = new MarkdownIt();

md.use(anchor);

await md.isReady();

// anchor is initialized completely

const result = await md.render('# h1\nHello world!');
```

`MarkdownItEnahcner.prototype.use` would return itself, so you could call `MarkdownItEnahcner.prototype.isReady` by chain style.

```typescript
import { MarkdownIt } from "markdown-it-enhancer";
import { anchor } from "markdown-it-anchor-for-enahncer";

const md = new MarkdownIt();

await md.use(anchor).isReady();

// anchor is initialized completely

const result = await md.render('# h1\nHello world!');
```

you could call `MarkdownItEnahcner.prototype.use` repeatedly. Just remember that call `MarkdownItEnahcner.prototype.use` and then call `MarkdownItEnahcner.prototype.isReady`

## Async or Sync Parser Rule

<!-- TODO -->

## Async or Sync Renderer Rule

<!-- TODO -->

## Async Highlight Function

<!-- TODO -->

## Async methods


- MarkdownItEnhancer.prototype.parse
- MarkdownItEnhancer.prototype.render
- MarkdownItEnhancer.prototype.parseInline
- MarkdownItEnhancer.prototype.renderInline
