import { describe, expect, it } from "vitest";

import { format, parse } from "../src";
import fixtures from "./fixtures/url";

describe("format", () => {
  Object.keys(fixtures).forEach((url) => {
    it(url, () => {
      console.log(url, parse(url));
      const parsed = parse(url);
      expect(format(parsed)).toBe(url);
    });
  });
});
