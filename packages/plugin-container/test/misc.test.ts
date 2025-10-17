import { MarkdownIt } from "@markdown-it-enhancer/core";
import { describe, expect, it } from "vitest";

import { container } from "../src";

describe("coverage", () => {
  it("marker coverage", async () => {
    const md = new MarkdownIt().use(container, "fox", {
      marker: "foo",
      validate: p => (expect(p).toBe("fox"), true),
    });
    await md.isReady();
    const tokens = await md.parse("foofoofoofox\ncontent\nfoofoofoofoo\n");

    expect(tokens[0].markup).toBe("foofoofoo");
    expect(tokens[0].info).toBe("fox");
    expect(tokens[4].markup).toBe("foofoofoofoo");
  });
});
