import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { load } from "../src";

describe("Generator", () => {
  it("should parse meta", () => {
    load(join(__dirname, "fixtures/meta.txt"), (data) => {
      expect(data.meta).toStrictEqual({ desc: 123, skip: true });

      expect(data.fixtures.length).toBe(1);
      expect(data.fixtures[0].first.text).toBe("123\n");
      expect(data.fixtures[0].second.text).toBe("456\n");
    });
  });

  it("should parse headers", () => {
    load(join(__dirname, "fixtures/headers.txt"), (data) => {
      expect(data.fixtures.length).toBe(3);

      expect(data.fixtures[0].header).toBe("");
      expect(data.fixtures[0].first.text).toBe("123\n");
      expect(data.fixtures[0].second.text).toBe("456\n");

      expect(data.fixtures[1].header).toBe("header1");
      expect(data.fixtures[1].first.text).toBe("qwe\n");
      expect(data.fixtures[1].second.text).toBe("rty\n");

      expect(data.fixtures[2].header).toBe("header2");
      expect(data.fixtures[2].first.text).toBe("zxc\n");
      expect(data.fixtures[2].second.text).toBe("vbn\n");
    });
  });

  it("should parse multilines", () => {
    load(join(__dirname, "fixtures/multilines.txt"), (data) => {
      expect(data.fixtures.length).toBe(1);

      expect(data.fixtures[0].header).toBe("");
      expect(data.fixtures[0].first.text).toBe("123\n \n456\n");
      expect(data.fixtures[0].second.text).toBe("789\n\n098\n");
    });
  });

  it("should not add \\n at empty to end of empty line", () => {
    load(join(__dirname, "fixtures/empty.txt"), (data) => {
      expect(data.fixtures[0].first.text).toBe("a\n");
      expect(data.fixtures[0].second.text).toBe("");
    });
  });

  it("should scan dir", function () {
    let files = 0;

    load(join(__dirname, "fixtures"), () => {
      files++;
    });
    expect(files).toBe(4);
  });
});
