import { describe, expect, it } from "vitest";

import { parse } from "../src";
import fixtures from "./fixtures/url";

describe("parse", () => {
  Object.keys(fixtures).forEach((url) => {
    it(url, () => {
      const parsed = parse(url);

      Object.keys(parsed).forEach((x) => {
        // @ts-expect-error ignore
        if (parsed[x] === null) {
          // @ts-expect-error ignore
          delete parsed[x];
        }
      });

      expect(parsed).toMatchObject(fixtures[url]);
    });
  });
});
