import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MarkdownIt } from "markdown-it-enhancer";
import { generate } from "markdown-it-enhancer-test-toolkit";
import { describe, expect, it } from "vitest";

import { emoji as emoji_bare } from "../src/bare";
import emojies_defs from "../src/data/full";
import emojies_defs_light from "../src/data/light";
// data for integrity check testing
import emojies_shortcuts from "../src/data/shortcuts";
import { emoji as emoji_full } from "../src/full";
import { emoji as emoji_light } from "../src/light";

describe("markdown-it-emoji", async () => {
  let md = new MarkdownIt().use(emoji_full, {});
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/default", import.meta.url)), md);

  generate(fileURLToPath(new URL("fixtures/full.txt", import.meta.url)), md);

  md = new MarkdownIt().use(emoji_full, {
    defs: {
      one: "!!!one!!!",
      fifty: "!!50!!",
    },
    shortcuts: {
      fifty: [":50", "|50"],
      one: ":uno",
    },
  });
  await md.isReady();
  generate(fileURLToPath(new URL("fixtures/options.txt", import.meta.url)), md);

  md = new MarkdownIt().use(emoji_full, { enabled: ["smile", "grin"] });
  await md.isReady();
  generate(
    fileURLToPath(new URL("fixtures/whitelist.txt", import.meta.url)),
    md,
  );

  md = new MarkdownIt({ linkify: true }).use(emoji_full, {});
  await md.isReady();
  generate(
    fileURLToPath(new URL("fixtures/autolinks.txt", import.meta.url)),
    md,
  );
});

describe("markdown-it-emoji-light", async () => {
  let md = new MarkdownIt().use(emoji_light, {});
  await md.isReady();
  generate(
    fileURLToPath(new URL("fixtures/default", import.meta.url)),
    // { header: true },
    md,
  );

  generate(fileURLToPath(new URL("fixtures/light.txt", import.meta.url)), md);

  md = new MarkdownIt().use(emoji_light, {
    defs: {
      one: "!!!one!!!",
      fifty: "!!50!!",
    },
    shortcuts: {
      fifty: [":50", "|50"],
      one: ":uno",
    },
  });
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/options.txt", import.meta.url)), md);

  md = new MarkdownIt().use(emoji_light, { enabled: ["smile", "grin"] });
  await md.isReady();
  generate(
    fileURLToPath(new URL("fixtures/whitelist.txt", import.meta.url)),
    md,
  );

  md = new MarkdownIt({ linkify: true }).use(emoji_full, {});
  await md.isReady();
  generate(
    fileURLToPath(new URL("fixtures/autolinks.txt", import.meta.url)),
    md,
  );
});

describe("markdown-it-emoji-bare", async () => {
  let md = new MarkdownIt().use(emoji_bare, {});
  await md.isReady();
  generate(fileURLToPath(new URL("fixtures/bare.txt", import.meta.url)), md);

  md = new MarkdownIt().use(emoji_bare, {
    defs: {
      one: "!!!one!!!",
      fifty: "!!50!!",
    },
    shortcuts: {
      fifty: [":50", "|50"],
      one: ":uno",
    },
  });
  generate(fileURLToPath(new URL("fixtures/options.txt", import.meta.url)), md);
});

describe("integrity", () => {
  it("all shortcuts should exist", () => {
    Object.keys(emojies_shortcuts).forEach((name) => {
      expect(emojies_defs[name], "shortcut doesn't exist: " + name);
    });
  });

  it("no chars with \"uXXXX\" names allowed", () => {
    Object.keys(emojies_defs).forEach((name) => {
      if (/^u[0-9a-b]{4,}$/i.test(name)) {
        throw Error("Name " + name + " not allowed");
      }
    });
  });

  it("all light chars should exist", () => {
    const visible = readFileSync(
      new URL("../support/visible.txt", import.meta.url),
      "utf8",
    );

    const available = Object.keys(emojies_defs_light).map(function (k) {
      return emojies_defs_light[k].replace(/\uFE0F/g, "");
    });

    let missed = "";

    Array.from(visible).forEach(function (ch) {
      if (available.indexOf(ch) < 0) {
        missed += ch;
      }
    });

    if (missed) {
      throw new Error("Characters " + missed + " missed.");
    }
  });
});
