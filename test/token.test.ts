import { describe, expect, it } from "vitest";

import Token from "../lib/token";

describe("Token", () => {
  it("attr", () => {
    const t = new Token("test_token", "tok", 1);

    expect(t.attrs).toBe(null);
    expect(t.attrIndex("foo")).toBe(-1);

    t.attrPush(["foo", "bar"]);
    t.attrPush(["baz", "bad"]);

    expect(t.attrIndex("foo")).toBe(0);
    expect(t.attrIndex("baz")).toBe(1);
    expect(t.attrIndex("none")).toBe(-1);
  });
});
