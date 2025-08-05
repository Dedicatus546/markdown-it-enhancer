import { readFile } from "node:fs/promises";

import { CheerioAPI, load } from "cheerio";
import { MarkdownIt } from "markdown-it-enhancer";
import { beforeAll, describe, expect, it } from "vitest";

import { taskLists } from "../src";

describe("markdown-it-task-lists", () => {
  const fixtures: Record<string, string> = {},
    rendered: Record<string, string> = {},
    $: Record<string, CheerioAPI> = {};
  let md: MarkdownIt;

  beforeAll(async () => {
    const files: Record<string, string> = {
      bullet: "bullet.md",
      ordered: "ordered.md",
      mixedNested: "mixed-nested.md",
      dirty: "dirty.md",
    };

    md = new MarkdownIt();
    md.use(taskLists, {});
    await md.isReady();

    for (const key in files) {
      fixtures[key] = await readFile(__dirname + "/fixtures/" + files[key], {
        encoding: "utf-8",
      });
      rendered[key] = await md.render(fixtures[key]);
      $[key] = load(rendered[key]);
    }
  });

  it("renders tab-indented code differently than default markdown-it", async () => {
    const md1 = new MarkdownIt();
    const md2 = new MarkdownIt();
    md2.use(taskLists, {});
    await md2.isReady();
    await expect(md1.render(fixtures.bullet)).resolves.not.toBe(
      md2.render(fixtures.bullet),
    );
  });

  it("adds input.task-list-item-checkbox in items", () => {
    expect(~$.bullet("input.task-list-item-checkbox").length).toBeTruthy();
  });

  it("renders items marked up as [ ] as unchecked", () => {
    const shouldBeUnchecked = (fixtures.ordered.match(/[.*+-]\s+\[ \]/g) || [])
      .length;
    expect(shouldBeUnchecked).toBe(
      $.ordered("input[type=checkbox].task-list-item-checkbox:not(:checked)")
        .length,
    );
  });

  it("renders items marked up as [x] as checked", () => {
    const shouldBeChecked = (fixtures.ordered.match(/[.*+-]\s+\[[Xx]\]/g) || [])
      .length;
    expect(shouldBeChecked).toBe(
      $.ordered("input[type=checkbox].task-list-item-checkbox:checked").length,
    );
  });

  it("disables the rendered checkboxes", () => {
    expect(
      $.bullet("input[type=checkbox].task-list-item-checkbox:not([disabled])")
        .length,
    ).toBeFalsy();
  });

  it("enables the rendered checkboxes when options.enabled is truthy", async () => {
    const md = new MarkdownIt();
    md.use(taskLists, { enabled: true });
    await md.isReady();
    const $$ = load(await md.render(fixtures.ordered));
    expect(
      $$("input[type=checkbox].task-list-item-checkbox:not([disabled])")
        .length > 0,
    ).toBeTruthy();
  });

  it("adds class `enabled` to <li> elements when options.enabled is truthy", async () => {
    const md = new MarkdownIt();
    md.use(taskLists, { enabled: true });
    await md.isReady();
    const $$ = load(await md.render(fixtures.ordered));
    expect($$(".task-list-item:not(.enabled)").length).toBe(0);
  });

  it("skips rendering wrapping <label> elements", () => {
    expect(0).toBe($.bullet("label").length);
    expect(0).toBe($.ordered("label").length);
    expect(0).toBe($.mixedNested("label").length);
    expect(0).toBe($.dirty("label").length);
  });

  it("does not render wrapping <label> elements when options.label is falsy", async () => {
    const md = new MarkdownIt();
    md.use(taskLists, { label: false });
    await md.isReady();
    const $$ = load(await md.render(fixtures.ordered));
    expect(0).toBe($$("label").length);
  });

  it("wraps the rendered list items' contents in a <label> element when options.label is truthy", async () => {
    const md = new MarkdownIt();
    md.use(taskLists, { label: true });
    await md.isReady();
    const $$ = load(await md.render(fixtures.ordered));
    expect(
      $$(
        ".task-list-item > label > input[type=checkbox].task-list-item-checkbox",
      ).length > 0,
    ).toBeTruthy();
  });

  it("wraps and enables items when options.enabled and options.label are truthy", async () => {
    const md = new MarkdownIt();
    md.use(taskLists, { enabled: true, label: true });
    await md.isReady();
    const $$ = load(await md.render(fixtures.ordered));
    expect(
      $$(
        ".task-list-item > label > input[type=checkbox].task-list-item-checkbox:not([disabled])",
      ).length > 0,
    ).toBeTruthy();
  });

  it("adds label after items when options.label and options.labelAfter are truthy", async () => {
    const md = new MarkdownIt();
    md.use(taskLists, {
      enabled: true,
      label: true,
      labelAfter: true,
    });
    await md.isReady();
    const $$ = load(await md.render(fixtures.ordered));
    expect(
      $$(
        ".task-list-item > input[type=checkbox].task-list-item-checkbox:not([disabled])",
      )
        .next()
        .is("label"),
    ).toBeTruthy();
  });

  it('does NOT render [  ], "[ ]" (no space after closing bracket), [ x], [x ], or [ x ] as checkboxes', () => {
    const html = $.dirty.html();
    expect(~html.indexOf("<li>[  ]")).toBeTruthy();
    expect(~html.indexOf("<li>[ ]</li>")).toBeTruthy();
    expect(~html.indexOf("<li>[x ]")).toBeTruthy();
    expect(~html.indexOf("<li>[ x]")).toBeTruthy();
    expect(~html.indexOf("<li>[ x ]")).toBeTruthy();
  });

  it("adds class .task-list-item to parent <li>", () => {
    expect(~$.bullet("li.task-list-item").length).toBeTruthy();
  });

  it("adds class .contains-task-list to lists", () => {
    expect(
      ~$.bullet("ol.contains-task-list, ul.contains-task-list").length,
    ).toBeTruthy();
  });

  it("only adds .contains-task-list to most immediate parent list", () => {
    expect(
      $.mixedNested("ol:not(.contains-task-list) ul.contains-task-list").length,
    ).toBeTruthy();
  });
});
