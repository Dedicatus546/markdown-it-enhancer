import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import legacy from "../maps/legacy.json" with { type: "json" };
import {
  decode,
  decodeHTML,
  decodeStrict,
  decodeXML,
  DecodingMode,
  encode,
  EncodingMode,
  EntityLevel,
  EntityLevelType,
  escape,
  escapeUTF8,
} from "../src";

const levels = ["xml", "entities"];

describe("Documents", () => {
  const levelDocuments = levels
    .map(name => new URL(`../maps/${name}.json`, import.meta.url))
    .map(
      url => JSON.parse(readFileSync(url, "utf8")) as Record<string, string>,
    )
    .map((document, index) => [index, document] as const);

  for (const [level, document] of levelDocuments) {
    describe("Decode", () => {
      it(levels[level], () => {
        for (const entity of Object.keys(document)) {
          for (let l = level; l < levels.length; l++) {
            expect(decode(`&${entity};`, l as EntityLevelType)).toBe(
              document[entity],
            );
            expect(decode(`&${entity};`, { level: l as EntityLevelType })).toBe(
              document[entity],
            );
          }
        }
      });
    });

    describe("Decode strict", () => {
      it(levels[level], () => {
        for (const entity of Object.keys(document)) {
          for (let l = level; l < levels.length; l++) {
            expect(decodeStrict(`&${entity};`, l as EntityLevelType)).toBe(
              document[entity],
            );
            expect(
              decode(`&${entity};`, {
                level: l as EntityLevelType,
                mode: DecodingMode.Strict,
              }),
            ).toBe(document[entity]);
          }
        }
      });
    });

    describe("Encode", () => {
      it(levels[level], () => {
        for (const entity of Object.keys(document)) {
          for (let l = level; l < levels.length; l++) {
            const encoded = encode(document[entity], l as EntityLevelType);
            const decoded = decode(encoded, l as EntityLevelType);
            expect(decoded).toBe(document[entity]);
          }
        }
      });

      it("should only encode non-ASCII values if asked", () =>
        expect(
          encode("Great #'s of 🎁", {
            level: level as EntityLevelType,
            mode: EncodingMode.ASCII,
          }),
        ).toBe("Great #&apos;s of &#x1f381;"));
    });
  }

  describe("Legacy", () => {
    const legacyMap = legacy as Record<string, string>;
    it("should decode", () => {
      for (const entity of Object.keys(legacyMap)) {
        expect(decodeHTML(`&${entity}`)).toBe(legacyMap[entity]);
        expect(
          decodeStrict(`&${entity}`, {
            level: EntityLevel.HTML,
            mode: DecodingMode.Legacy,
          }),
        ).toBe(legacyMap[entity]);
      }
    });
  });
});

const astral = [
  ["1d306", "\uD834\uDF06"],
  ["1d11e", "\uD834\uDD1E"],
];

const astralSpecial = [
  ["80", "\u20AC"],
  ["110000", "\uFFFD"],
];

describe("Astral entities", () => {
  for (const [c, value] of astral) {
    it(`should decode ${value}`, () => expect(decode(`&#x${c};`)).toBe(value));

    it(`should encode ${value}`, () => expect(encode(value)).toBe(`&#x${c};`));

    it(`should escape ${value}`, () => expect(escape(value)).toBe(`&#x${c};`));
  }

  for (const [c, value] of astralSpecial) {
    it(`should decode special \\u${c}`, () =>
      expect(decode(`&#x${c};`)).toBe(value));
  }
});

describe("Escape", () => {
  it("should always decode ASCII chars", () => {
    for (let index = 0; index < 0x7f; index++) {
      const c = String.fromCharCode(index);
      expect(decodeXML(escape(c))).toBe(c);
    }
  });

  it("should keep UTF8 characters", () =>
    expect(escapeUTF8("ß < \"ü\"")).toBe("ß &lt; &quot;ü&quot;"));
});
