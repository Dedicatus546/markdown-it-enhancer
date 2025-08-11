import { describe, expect, it } from "vitest";

import { MarkdownIt } from "../src";
import { delay } from "./utils";

describe("markdown-it-extra", () => {
  it("don't parse when --- indented more than 3 spaces", async () => {
    const md = new MarkdownIt();
    // 只保留 lheading，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["lheading", "paragraph"]);
    const source = "    const val = 1\n---";
    const target = "<p>const val = 1\n---</p>\n";

    await expect(md.render(source)).resolves.toBe(target);
  });

  it("don't parse when === indented more than 3 spaces", async () => {
    const md = new MarkdownIt();
    // 只保留 lheading，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["lheading", "paragraph"]);
    const source = "    const val = 1\n===";
    const target = "<p>const val = 1\n===</p>\n";

    await expect(md.render(source)).resolves.toBe(target);
  });

  it("don't parse when reference indented more than 3 spaces", async () => {
    const md = new MarkdownIt();
    // 只保留 reference，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["reference", "paragraph"]);
    const source = "    [reference_title][reference_url]";
    const target = "<p>[reference_title][reference_url]</p>\n";

    await expect(md.render(source)).resolves.toBe(target);
  });

  it("don't parse to token when table max autocomplete cells > MAX_AUTOCOMPLETED_CELLS", async () => {
    const md = new MarkdownIt();
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
      "<th style=\"text-align:center\">title1</th>",
      "<th style=\"text-align:center\">title2</th>",
      "<th style=\"text-align:center\">title3</th>",
      "<th style=\"text-align:center\">title4</th>",
      "</tr>",
      "</thead>",
      "<tbody>",
      "<tr>",
      "<td style=\"text-align:center\">1</td>",
      "<td style=\"text-align:center\">2</td>",
      "<td style=\"text-align:center\"></td>",
      "<td style=\"text-align:center\"></td>",
      "</tr>",
      "<tr>",
      "<td style=\"text-align:center\">1</td>",
      "<td style=\"text-align:center\">2</td>",
      "<td style=\"text-align:center\"></td>",
      "<td style=\"text-align:center\"></td>",
      "</tr>",
      "</tbody>",
      "</table>",
      "<p>|1|2|</p>",
      "",
    ].join("\n");
    await expect(
      md.render(source, {
        maxAutoCompletedCells: 5,
      }),
    ).resolves.toBe(target);
  });

  it("don't render table when second line is |a|", async () => {
    const md = new MarkdownIt();
    // 只保留 reference，有个代码分支需要单独测试
    md.block.ruler.enableOnly(["table", "paragraph"]);
    const source = ["|title1|", "|1|"].join("\n");
    const target = "<p>|title1|\n|1|</p>\n";

    await expect(md.render(source)).resolves.toBe(target);
  });

  it("async highlight", async () => {
    const md = new MarkdownIt({
      async highlight() {
        const { resolve, promise } = Promise.withResolvers<void>();
        setTimeout(() => {
          resolve();
        }, 2000);
        await promise;
        return "async-result";
      },
    });
    await expect(md.render("```\n```")).resolves.toBe(
      "<pre><code>async-result</code></pre>\n",
    );
  });

  it("async plugin sequence", async () => {
    const md = new MarkdownIt();
    const r: Array<string> = [];

    await md
      .use(async () => {
        await delay(3);
        r.push("plugin 1");
      })
      .use(async () => {
        await delay(1);
        r.push("plugin 2");
      })
      .isReady();

    expect(r).toStrictEqual(["plugin 1", "plugin 2"]);
  });

  it("create markdown-it instance by run MarkdownIt directly", async () => {
    const md = new MarkdownIt();

    await expect(md.render("hello world")).resolves.toBe(
      "<p>hello world</p>\n",
    );
  });

  it("check fence rule when attrs include class attr", async () => {
    const md = new MarkdownIt();
    await md
      .use((md) => {
        const defaultFence = md.renderer.rules.fence;
        md.renderer.rules.fence = function (tokens, idx, ...restArgs) {
          const token = tokens[idx];
          token.attrPush(["class", "custom-class"]);
          return defaultFence?.(tokens, idx, ...restArgs) ?? "";
        };
      })
      .isReady();
    await expect(md.render("```javascript\nconst a = 1;\n```")).resolves.toBe(
      "<pre><code class=\"custom-class language-javascript\">const a = 1;\n</code></pre>\n",
    );
  });
});
