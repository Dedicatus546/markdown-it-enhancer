import { describe, expect, it } from "vitest";

import { encode } from "../src";

describe("encode", () => {
  it("should encode percent", () => {
    expect(encode("%%%")).toBe("%25%25%25");
  });

  it("should encode control chars", () => {
    expect(encode("\r\n")).toBe("%0D%0A");
  });

  it("should not encode parts of an url", () => {
    expect(encode("?#")).toBe("?#");
  });

  it("should not encode []^ - commonmark tests", () => {
    expect(encode("[]^")).toBe("%5B%5D%5E");
  });

  it("should encode spaces", () => {
    expect(encode("my url")).toBe("my%20url");
  });

  it("should encode unicode", () => {
    expect(encode("φου")).toBe("%CF%86%CE%BF%CF%85");
  });

  it("should encode % if it doesn't start a valid escape seq", () => {
    expect(encode("%FG")).toBe("%25FG");
  });

  it("should preserve non-utf8 encoded characters", () => {
    expect(encode("%00%FF")).toBe("%00%FF");
  });

  it("should encode characters on the cache borders", () => {
    // protects against off-by-one in cache implementation
    expect(encode("\x00\x7F\x80")).toBe("%00%7F%C2%80");
  });

  describe("arguments", () => {
    it("encode(string, unescapedSet)", () => {
      expect(encode("!@#$", "@$")).toBe("%21@%23$");
    });

    it("encode(string, keepEscaped=true)", () => {
      expect(encode("%20%2G", true)).toBe("%20%252G");
    });

    it("encode(string, keepEscaped=false)", () => {
      expect(encode("%20%2G", false)).toBe("%2520%252G");
    });

    it("encode(string, unescapedSet, keepEscaped)", () => {
      expect(encode("!@%25", "@", false)).toBe("%21@%2525");
    });
  });

  describe("surrogates", () => {
    it("bad surrogates (high)", () => {
      expect(encode("\uD800foo")).toBe("%EF%BF%BDfoo");
      expect(encode("foo\uD800")).toBe("foo%EF%BF%BD");
    });

    it("bad surrogates (low)", () => {
      expect(encode("\uDD00foo")).toBe("%EF%BF%BDfoo");
      expect(encode("foo\uDD00")).toBe("foo%EF%BF%BD");
    });

    it("valid one", () => {
      expect(encode("\uD800\uDD00")).toBe("%F0%90%84%80");
    });
  });
});
