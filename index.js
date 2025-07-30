import MarkdownItOld from "markdown-it";

import MarkdownIt from "./dist/index.js";

const md = MarkdownIt({
  html: true,
});

const res = await md.render("<foobar>foobar</foobar>");

console.log("m1", res);

console.log(
  "m2",
  MarkdownItOld({ html: true }).render("<foobar>foobar</foobar>"),
);
