import {describe, it} from "vitest";

import { parse } from "../src;
import fixtures from "./fixtures/url";

describe("parse", () => {
  Object.keys(fixtures).forEach(function (url) {
    it(url, () => {
      const parsed = parse(url);

      Object.keys(parsed).forEach(function (x) {
        if (parsed[x] === null) {
          delete parsed[x];
        }
      });

      assert.deepEqual(parsed, fixtures[url]);
    });
  });
});
