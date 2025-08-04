import { describe, expect, it } from "vitest";

import { Any, Cc, Cf, P, S, Z } from "../src";

describe("Unicode classes", () => {
  it("Any", () => {
    expect(Any.test("A")).toBeTruthy();
    expect(Any.test("")).toBeFalsy();
  });

  it("Cc", () => {
    expect(Cc.test("\r")).toBeTruthy();
    expect(Cc.test("A")).toBeFalsy();
  });

  it("Cf", () => {
    expect(Cf.test("\xAD")).toBeTruthy();
    expect(Cf.test("A")).toBeFalsy();
  });

  it("P", () => {
    expect(P.test(",")).toBeTruthy();
    expect(P.test("A")).toBeFalsy();
  });

  it("S", () => {
    expect(S.test("$")).toBeTruthy();
    expect(S.test("£")).toBeTruthy();
    expect(S.test("€")).toBeTruthy();
    expect(S.test("A")).toBeFalsy();
    expect(S.test("")).toBeFalsy();
    expect(S.test(",")).toBeFalsy();
  });

  it("Z", () => {
    expect(Z.test(" ")).toBeTruthy();
    expect(Z.test("\u2028")).toBeTruthy();
    expect(Z.test("\u2029")).toBeTruthy();
    expect(Z.test("A")).toBeFalsy();
  });
});
