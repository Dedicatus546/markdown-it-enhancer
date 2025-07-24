import MarkdownIt, { setTableMaxAutoCompletedCells } from "../lib";
import { describe, assert, it } from "vitest";

describe("markdown-it-extra", () => {
  it("don't parse when --- indented more than 3 spaces", async () => {
    const md = new MarkdownIt();
    // 只保留 lheading，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["lheading", "paragraph"]);
    const source = "    const val = 1\n---";
    const target = "<p>const val = 1\n---</p>\n";

    assert.strictEqual(await md.render(source), target);
  });

  it("don't parse when === indented more than 3 spaces", async () => {
    const md = new MarkdownIt();
    // 只保留 lheading，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["lheading", "paragraph"]);
    const source = "    const val = 1\n===";
    const target = "<p>const val = 1\n===</p>\n";

    assert.strictEqual(await md.render(source), target);
  });

  it("don't parse when reference indented more than 3 spaces", async () => {
    const md = new MarkdownIt();
    // 只保留 reference，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["reference", "paragraph"]);
    const source = "    [reference_title][reference_url]";
    const target = "<p>[reference_title][reference_url]</p>\n";

    assert.strictEqual(await md.render(source), target);
  });

  it("don't parse to token when table max autocomplete cells > MAX_AUTOCOMPLETED_CELLS", async () => {
    const md = new MarkdownIt();
    setTableMaxAutoCompletedCells(5);
    const source = [
      "|title1|title2|title3|title4|",
      "|:---:|:----:|:----:|:----:|",
      "|1|2|", // 自动补充 2 个
      "|1|2|", // 自动补充 2 个
      "|1|2|", // 自动补充 2 个
    ].join("\n");
    const target = [
      "<table>",
      "<thead>",
      "<tr>",
      '<th style="text-align:center">title1</th>',
      '<th style="text-align:center">title2</th>',
      '<th style="text-align:center">title3</th>',
      '<th style="text-align:center">title4</th>',
      "</tr>",
      "</thead>",
      "<tbody>",
      "<tr>",
      '<td style="text-align:center">1</td>',
      '<td style="text-align:center">2</td>',
      '<td style="text-align:center"></td>',
      '<td style="text-align:center"></td>',
      "</tr>",
      "<tr>",
      '<td style="text-align:center">1</td>',
      '<td style="text-align:center">2</td>',
      '<td style="text-align:center"></td>',
      '<td style="text-align:center"></td>',
      "</tr>",
      "</tbody>",
      "</table>",
      "<p>|1|2|</p>",
      "",
    ].join("\n");
    assert.strictEqual(await md.render(source), target);
  });

  it("don't render table when second line is |a|", async () => {
    const md = new MarkdownIt();
    // 只保留 reference，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["table", "paragraph"]);
    const source = ["|title1|", "|1|"].join("\n");
    const target = "<p>|title1|\n|1|</p>\n";

    assert.strictEqual(await md.render(source), target);
  });
});
