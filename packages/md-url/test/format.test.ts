import {describe, it} from "vitest";

import { format, parse } from "../src";
import fixtures from "./fixtures/url";

describe("format", () => {
  Object.keys(fixtures).forEach((url) => {
    it(url, () => {
      const parsed = parse(url);
      assert.strictEqual(format(parsed), url);
    });
  });
});
