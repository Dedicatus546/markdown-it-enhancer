import { assert, describe, it } from "vitest";

import MarkdownIt from "../lib";

describe("test", () => {
  it("don't parse when reference indented more than 3 spaces", async () => {
    const md = new MarkdownIt();
    // 只保留 reference，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["reference", "paragraph"]);
    const source = "    [reference_title][reference_url]";
    const target = "<p>[reference_title][reference_url]</p>\n";

    const result = await md.render(source);

    assert.strictEqual(result, target);
  });
});
