# What is Markdown-It-Enhancer?

Markdown-It-Enhancer is a fork of [Markdown-It](https://github.com/markdown-it/markdown-it). Its core is the same as Markdown-It, but there are some changes in this fork.

## All TypeScript

Markdown-It-Enhancer is 100% writing by TypeScript. Now you  you don't need to install `@types/markdown-it`.

## ESM only

Markdown-It-Enhancer is no longer support CJS.

## Async Support

We know some methods(like `render` or `parse`) in Markdown-It is sync, In some cases when you want to write some async code for a parser ruler or a renderer ruler, it is difficult to archieve it.

In Markdown-It-Enhancer, `render`, `parse` migrate to async function. Now you can write a async parser ruler, a async renderer ruler and a async highlight function.
