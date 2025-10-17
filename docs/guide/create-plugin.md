# Create Plugin

- Remove `markdown-it` and `@types/markdown-it` deps.

```sh [pnpm]
$ pnpm remove markdown-it @types/markdown-it
```

- Add `markdown-it-enhancer` dep to peerDependencies.

```json5
// package.json
{
  // other ...
  "peerDependencies": {
    "markdown-it-enhancer": "^15.0.0"
  },
  "peerDependenciesMeta": {
    "markdown-it-enhancer": {
      "optional": true
    }
  },
}
```

Then install it.

```sh [pnpm]
$ pnpm i
```

- If your plugin writed by js, I recommend you to change to typescript and use `tsdown` to build it.

```sh [pnpm]
$ pnpm add tsdown -D
```

Create a `tsdown.config.ts` file.

```typescript
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    // it depends on the file position.
    // maybe "index.ts" (in root position)
    "src/index.ts",
  ],
  dts: {
    sourcemap: true,
  },
  sourcemap: true,
  target: "node20",
});
```

Then edit you build script.

```json5
// package.json
{
  // ...
  "scripts": {
    "build": "tsdown"
  },
}
```

- Import `MarkdownItPlugin` type to get a plugin type hint.

```typescript
// before
import MarkdownIt from "markdown-it";

const pluginA = (md: MarkdownIt) => {

}

// after
import type { MarkdownItPlugin } from "markdown-it-enhancer";

const pluginA: MarkdownItPlugin = (md) => {
  // 'md' has correct type hint.
}
```

If your plugin has some options, you could write it just like following code.

```typescript
import type { MarkdownItPlugin } from "markdown-it-enhancer";

interface PluginAOptions = {
  property1?: string
  property2?: number
  property3?: boolean
}

const pluginA: MarkdownItPlugin<[options?: PluginAOptions]> = (md, options = {}) => {
  // 'md' has correct type hint.
  // 'options' has correct type hint.
}
```

