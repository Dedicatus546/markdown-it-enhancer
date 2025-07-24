# markdown-it

这是一个 markdown-it 的 fork 版本。主要有以下变更：

- 不再提供 cjs 输出，仅支持 ESM 。
- 源码迁移到 typescript 上，提供类型。
- 构建工具迁移到 vite 上。
- 测试迁移到 vitest 上。
- 异步支持，包括异步规则、异步插件和异步的高亮函数

尽量和原仓库在 ESM 上完全兼容，目前还在修改阶段，源码基本以迁移到 typescript 上，单元测试基本迁移到 vitest 上，并且测试通过率已达到 100% 。
