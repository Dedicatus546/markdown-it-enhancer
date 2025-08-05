import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

import { LinkifyIt } from "../src";
import tlds from "./tlds.json";

let lines: Array<string> = [];

describe("links", () => {
  const l = new LinkifyIt({ fuzzyIP: true });

  l.normalize = function () {}; // kill normalizer

  lines = readFileSync(
    new URL("fixtures/links.txt", import.meta.url),
    "utf8",
  ).split(/\r?\n/g);

  let skipNext = false;

  lines.forEach((line, idx) => {
    if (skipNext) {
      skipNext = false;
      return;
    }

    line = line.replace(/^%.*/, "");

    const next = (lines[idx + 1] || "").replace(/^%.*/, "");

    if (!line.trim()) {
      return;
    }

    if (next.trim()) {
      it("line " + (idx + 1), () => {
        expect(
          l.pretest(line),
          "(pretest failed in `" + line + "`)",
        ).toBeTruthy();
        expect(
          l.test("\n" + line + "\n"),
          "(link not found in `\\n" + line + "\\n`)",
        ).toBeTruthy();
        expect(l.test(line), "(link not found in `" + line + "`)").toBeTruthy();
        expect(l.match(line)?.[0].url).toBe(next);
      });
      skipNext = true;
    } else {
      it("line " + (idx + 1), () => {
        expect(
          l.pretest(line),
          "(pretest failed in `" + line + "`)",
        ).toBeTruthy();
        expect(
          l.test("\n" + line + "\n"),
          "(link not found in `\\n" + line + "\\n`)",
        ).toBeTruthy();
        expect(l.test(line), "(link not found in `" + line + "`)").toBeTruthy();
        expect(l.match(line)?.[0].url).toBe(line);
      });
    }
  });
});

describe("not links", () => {
  const l = new LinkifyIt();

  l.normalize = function () {}; // kill normalizer

  lines = readFileSync(
    new URL("fixtures/not_links.txt", import.meta.url),
    "utf8",
  ).split(/\r?\n/g);

  lines.forEach((line, idx) => {
    line = line.replace(/^%.*/, "");

    if (!line.trim()) {
      return;
    }

    it("line " + (idx + 1), () => {
      expect(
        !l.test(line),
        "(should not find link in `" +
          line +
          "`, but found `" +
          JSON.stringify((l.match(line) || [])[0]) +
          "`)",
      ).toBeTruthy();
    });
  });
});

describe("API", () => {
  it("extend tlds", () => {
    const l = new LinkifyIt();

    expect(l.test("google.myroot")).toBeFalsy();

    l.tlds("myroot", true);

    expect(l.test("google.myroot")).toBeTruthy();
    expect(l.test("google.xyz")).toBeFalsy();

    l.tlds(tlds);

    expect(l.test("google.xyz")).toBeTruthy();
    expect(l.test("google.myroot")).toBeFalsy();
  });

  it("add rule as regexp, with default normalizer", () => {
    const l = new LinkifyIt().add("my:", {
      validate: /^\/\/[a-z]+/,
    });

    const match = l.match("google.com. my:// my://asdf!");

    expect(match?.[0].text).toBe("google.com");
    expect(match?.[1].text).toBe("my://asdf");
  });

  it("add rule with normalizer", () => {
    const l = new LinkifyIt().add("my:", {
      validate: /^\/\/[a-z]+/,
      normalize(m) {
        m.text = m.text.replace(/^my:\/\//, "").toUpperCase();
        m.url = m.url.toUpperCase();
      },
    });

    const match = l.match("google.com. my:// my://asdf!");

    expect(match?.[1].text).toBe("ASDF");
    expect(match?.[1].url).toBe("MY://ASDF");
  });

  it("disable rule", () => {
    const l = new LinkifyIt();

    expect(l.test("http://google.com")).toBeTruthy();
    expect(l.test("foo@bar.com")).toBeTruthy();
    // @ts-expect-error ignore
    l.add("http:", null);
    // @ts-expect-error ignore
    l.add("mailto:", null);
    expect(l.test("http://google.com")).toBeFalsy();
    expect(l.test("foo@bar.com")).toBeFalsy();
  });

  it("add bad definition", () => {
    let l: LinkifyIt;

    l = new LinkifyIt();

    expect(() => {
      // @ts-expect-error ignore
      l.add("test:", []);
    }).toThrowError();

    l = new LinkifyIt();

    expect(() => {
      // @ts-expect-error ignore
      l.add("test:", { validate: [] });
    }).toThrowError();

    l = new LinkifyIt();

    expect(() => {
      // @ts-expect-error ignore
      l.add("test:", {
        validate() {
          return false;
        },
        normalize: "bad",
      });
    }).toThrowError();
  });

  it("test at position", () => {
    const l = new LinkifyIt();

    expect(l.testSchemaAt("http://google.com", "http:", 5)).toBeTruthy();
    expect(l.testSchemaAt("http://google.com", "HTTP:", 5)).toBeTruthy();
    expect(l.testSchemaAt("http://google.com", "http:", 6)).toBeFalsy();
    expect(l.testSchemaAt("http://google.com", "bad_schema:", 6)).toBeFalsy();
  });

  it("correct cache value", () => {
    const l = new LinkifyIt();

    const match = l.match(
      ".com. http://google.com google.com ftp://google.com",
    );

    expect(match?.[0].text).toBe("http://google.com");
    expect(match?.[1].text).toBe("google.com");
    expect(match?.[2].text).toBe("ftp://google.com");
  });

  it("normalize", () => {
    const l = new LinkifyIt();

    let m = l.match("mailto:foo@bar.com")?.[0];

    // assert.strictEqual(m.text, 'foo@bar.com');
    expect(m?.url).toBe("mailto:foo@bar.com");

    m = l.match("foo@bar.com")?.[0];

    // assert.strictEqual(m.text, 'foo@bar.com');
    expect(m?.url).toBe("mailto:foo@bar.com");
  });

  it("test @twitter rule", () => {
    // @ts-expect-error ignore
    const l = new LinkifyIt().add("@", {
      validate(text, pos, self) {
        const tail = text.slice(pos);

        if (!self.re.twitter) {
          self.re.twitter = new RegExp(
            "^([a-zA-Z0-9_]){1,15}(?!_)(?=$|" + self.re.src_ZPCc + ")",
          );
        }
        if (self.re.twitter.test(tail)) {
          if (pos >= 2 && tail[pos - 2] === "@") {
            return false;
          }
          return tail.match(self.re.twitter)?.[0].length ?? 0;
        }
        return 0;
      },
      normalize(m) {
        m.url = "https://twitter.com/" + m.url.replace(/^@/, "");
      },
    });

    expect(l.match("hello, @gamajoba_!")?.[0].text).toBe("@gamajoba_");
    expect(l.match(":@givi")?.[0].text).toBe("@givi");
    expect(l.match(":@givi")?.[0].url).toBe("https://twitter.com/givi");
    expect(l.test("@@invalid")).toBeFalsy();
  });

  it("set option: fuzzyLink", () => {
    const l = new LinkifyIt({ fuzzyLink: false });

    expect(l.test("google.com.")).toBe(false);

    l.set({ fuzzyLink: true });

    expect(l.test("google.com.")).toBe(true);
    expect(l.match("google.com.")?.[0].text).toBe("google.com");
  });

  it("set option: fuzzyEmail", () => {
    const l = new LinkifyIt({ fuzzyEmail: false });

    expect(l.test("foo@bar.com.")).toBe(false);

    l.set({ fuzzyEmail: true });

    expect(l.test("foo@bar.com.")).toBe(true);
    expect(l.match("foo@bar.com.")?.[0].text).toBe("foo@bar.com");
  });

  it("set option: fuzzyIP", () => {
    const l = new LinkifyIt();

    expect(l.test("1.1.1.1.")).toBe(false);

    l.set({ fuzzyIP: true });

    expect(l.test("1.1.1.1.")).toBe(true);
    expect(l.match("1.1.1.1.")?.[0].text).toBe("1.1.1.1");
  });

  it("should not hang in fuzzy mode with sequences of astrals", () => {
    const l = new LinkifyIt();

    l.set({ fuzzyLink: true });

    l.match(
      "😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡 .com",
    );
  });

  it("should accept `---` if enabled", () => {
    let l = new LinkifyIt();

    expect(l.match("http://e.com/foo---bar")?.[0].text).toBe(
      "http://e.com/foo---bar",
    );
    expect(l.match("text@example.com---foo")).toBe(null);

    // @ts-expect-error ignore
    l = new LinkifyIt(null, { "---": true });

    expect(l.match("http://e.com/foo---bar")?.[0].text).toBe(
      "http://e.com/foo",
    );
    expect(l.match("text@example.com---foo")?.[0].text).toBe(
      "text@example.com",
    );
  });

  it("should find a match at the start", () => {
    const l = new LinkifyIt();

    l.set({ fuzzyLink: true });

    expect(l.matchAtStart("http://google.com 123")?.text).toBe(
      "http://google.com",
    );
    expect(l.matchAtStart("google.com 123")).toBeFalsy();
    expect(l.matchAtStart("  http://google.com 123")).toBeFalsy();
  });

  it("matchAtStart should not interfere with normal match", () => {
    const l = new LinkifyIt();
    let str;

    str = "http://google.com http://google.com";
    expect(l.matchAtStart(str)).toBeTruthy();
    expect(l.match(str)?.length).toBe(2);

    str = "aaa http://google.com http://google.com";
    expect(l.matchAtStart(str)).toBeFalsy();
    expect(l.match(str)?.length).toBe(2);
  });

  it("should not match incomplete links", () => {
    // regression test for https://github.com/markdown-it/markdown-it/issues/868
    const l = new LinkifyIt();

    expect(l.matchAtStart("http://")).toBeFalsy();
    expect(l.matchAtStart("https://")).toBeFalsy();
  });
});
