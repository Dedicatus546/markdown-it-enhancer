import { describe, expect, it } from "vitest";

import * as utils from "../lib/common/utils";

describe("Utils", () => {
  it("fromCodePoint", () => {
    const fromCodePoint = utils.fromCodePoint;

    expect(fromCodePoint(0x20)).toBe(" ");
    expect(fromCodePoint(0x1f601)).toBe("😁");
  });

  it("isValidEntityCode", () => {
    const isValidEntityCode = utils.isValidEntityCode;

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

  it("assign", () => {
    const assign = utils.assign;

    expect(assign({ a: 1 }, null, { b: 2 })).toStrictEqual({ a: 1, b: 2 });
  });

  it("escapeRE", () => {
    const escapeRE = utils.escapeRE;

    expect(escapeRE(" .?*+^$[]\\(){}|-")).toBe(
      " \\.\\?\\*\\+\\^\\$\\[\\]\\\\\\(\\)\\{\\}\\|\\-",
    );
  });

  it("isWhiteSpace", () => {
    const isWhiteSpace = utils.isWhiteSpace;

    expect(isWhiteSpace(0x2000)).toBe(true);
    expect(isWhiteSpace(0x09)).toBe(true);

    expect(isWhiteSpace(0x30)).toBe(false);
  });

  it("isMdAsciiPunct", () => {
    const isMdAsciiPunct = utils.isMdAsciiPunct;

    expect(isMdAsciiPunct(0x30)).toBe(false);

    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("").forEach(function (ch) {
      expect(isMdAsciiPunct(ch.charCodeAt(0))).toBe(true);
    });
  });

  it("unescapeMd", () => {
    const unescapeMd = utils.unescapeMd;

    expect(unescapeMd("\\foo")).toBe("\\foo");
    expect(unescapeMd("foo")).toBe("foo");

    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("").forEach(function (ch) {
      expect(unescapeMd("\\" + ch)).toBe(ch);
    });
  });
});
