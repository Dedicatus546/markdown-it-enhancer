import { describe, expect, it } from "vitest";

import Ruler from "@/ruler";

describe("Ruler", () => {
  it("should replace rule (.at)", () => {
    const ruler = new Ruler();
    let res = 0;

    ruler.push("test", function foo() {
      res = 1;
    });
    ruler.at("test", function bar() {
      res = 2;
    });

    const rules = ruler.getRules("");

    expect(rules.length).toBe(1);
    rules[0]();
    expect(res).toBe(2);
  });

  it("should inject before/after rule", () => {
    const ruler = new Ruler();
    let res = 0;

    ruler.push("test", function foo() {
      res = 1;
    });
    ruler.before("test", "before_test", function fooBefore() {
      res = -10;
    });
    ruler.after("test", "after_test", function fooAfter() {
      res = 10;
    });

    const rules = ruler.getRules("");

    expect(rules.length).toBe(3);
    rules[0]();
    expect(res).toBe(-10);
    rules[1]();
    expect(res).toBe(1);
    rules[2]();
    expect(res).toBe(10);
  });

  it("should enable/disable rule", () => {
    const ruler = new Ruler();
    let rules;

    ruler.push("test", function foo() {});
    ruler.push("test2", function bar() {});

    rules = ruler.getRules("");
    expect(rules.length).toBe(2);

    ruler.disable("test");
    rules = ruler.getRules("");
    expect(rules.length).toBe(1);
    ruler.disable("test2");
    rules = ruler.getRules("");
    expect(rules.length).toBe(0);

    ruler.enable("test");
    rules = ruler.getRules("");
    expect(rules.length).toBe(1);
    ruler.enable("test2");
    rules = ruler.getRules("");
    expect(rules.length).toBe(2);
  });

  it("should enable/disable multiple rule", () => {
    const ruler = new Ruler();
    let rules;

    ruler.push("test", function foo() {});
    ruler.push("test2", function bar() {});

    ruler.disable(["test", "test2"]);
    rules = ruler.getRules("");
    expect(rules.length).toBe(0);
    ruler.enable(["test", "test2"]);
    rules = ruler.getRules("");
    expect(rules.length).toBe(2);
  });

  it("should enable rules by whitelist", () => {
    const ruler = new Ruler();

    ruler.push("test", function foo() {});
    ruler.push("test2", function bar() {});

    ruler.enableOnly("test");
    const rules = ruler.getRules("");
    expect(rules.length).toBe(1);
  });

  it("should support multiple chains", () => {
    const ruler = new Ruler();
    let rules;

    ruler.push("test", function foo() {});
    ruler.push("test2", function bar() {}, { alt: ["alt1"] });
    ruler.push("test2", function bar() {}, { alt: ["alt1", "alt2"] });

    rules = ruler.getRules("");
    expect(rules.length).toBe(3);
    rules = ruler.getRules("alt1");
    expect(rules.length).toBe(2);
    rules = ruler.getRules("alt2");
    expect(rules.length).toBe(1);
  });

  it("should fail on invalid rule name", () => {
    const ruler = new Ruler();

    ruler.push("test", function foo() {});

    expect(() => ruler.at("invalid name", function bar() {})).throws();
    expect(() =>
      ruler.before("invalid name", "bar", function bar() {}),
    ).throws();
    expect(() =>
      ruler.after("invalid name", "bar", function bar() {}),
    ).throws();
    expect(() => ruler.enable("invalid name")).throws();
    expect(() => ruler.disable("invalid name")).throws();
  });

  it("should not fail on invalid rule name in silent mode", () => {
    const ruler = new Ruler();

    ruler.push("test", function foo() {});

    expect(() => ruler.enable("invalid name", true)).not.throws();
    expect(() => ruler.enableOnly("invalid name", true)).not.throws();
    expect(() => ruler.disable("invalid name", true)).not.throws();
  });
});
