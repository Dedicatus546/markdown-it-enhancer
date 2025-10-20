import {
  escapeRE,
  fromCodePoint,
  isMdAsciiPunct,
  isValidEntityCode,
  isWhiteSpace,
  unescapeMd,
} from "@markdown-it-enhancer/shared";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
  it("fromCodePoint", () => {
    expect(fromCodePoint(0x20)).toBe(" ");
    expect(fromCodePoint(0x1f601)).toBe("😁");
  });

  it("isValidEntityCode", () => {
    expect(isValidEntityCode(0x20)).toBe(true);
    expect(isValidEntityCode(0xd800)).toBe(false);
    expect(isValidEntityCode(0xfdd0)).toBe(false);
    expect(isValidEntityCode(0x1ffff)).toBe(false);
    expect(isValidEntityCode(0x1fffe)).toBe(false);
    expect(isValidEntityCode(0x00)).toBe(false);
    expect(isValidEntityCode(0x0b)).toBe(false);
    expect(isValidEntityCode(0x0e)).toBe(false);
    expect(isValidEntityCode(0x7f)).toBe(false);
  });

  it("escapeRE", () => {
    expect(escapeRE(" .?*+^$[]\\(){}|-")).toBe(
      " \\.\\?\\*\\+\\^\\$\\[\\]\\\\\\(\\)\\{\\}\\|\\-",
    );
  });

  it("isWhiteSpace", () => {
    expect(isWhiteSpace(0x2000)).toBe(true);
    expect(isWhiteSpace(0x09)).toBe(true);

    expect(isWhiteSpace(0x30)).toBe(false);
  });

  it("isMdAsciiPunct", () => {
    expect(isMdAsciiPunct(0x30)).toBe(false);

    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("").forEach(function (ch) {
      expect(isMdAsciiPunct(ch.charCodeAt(0))).toBe(true);
    });
  });

  it("unescapeMd", () => {
    expect(unescapeMd("\\foo")).toBe("\\foo");
    expect(unescapeMd("foo")).toBe("foo");

    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("").forEach(function (ch) {
      expect(unescapeMd("\\" + ch)).toBe(ch);
    });
  });
});
