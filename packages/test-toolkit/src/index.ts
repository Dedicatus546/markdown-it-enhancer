import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import yaml from "js-yaml";
import { MarkdownIt } from "markdown-it-enhancer";
import { isArray, isFunction, isString } from "markdown-it-enhancer-utils";
import { describe, expect, it } from "vitest";

import type { ParsedData } from "./types";
import { fixLF } from "./utils";

function parse(input: string, options: { sep: Array<string> }) {
  const lines = input.split(/\r?\n/g),
    max = lines.length;
  let min = 0,
    line = 0,
    fixture: ParsedData["fixtures"][number],
    i: number,
    l: string,
    currentSep: string,
    blockStart: number;

  const result: ParsedData = {
    fixtures: [],
    meta: "",
    file: "",
  };

  const sep = options.sep || ["."];

  // Try to parse meta
  if (/^-{3,}$/.test(lines[0] || "")) {
    line++;
    while (line < max && !/^-{3,}$/.test(lines[line])) {
      line++;
    }

    // If meta end found - extract range
    if (line < max) {
      result.meta = lines.slice(1, line).join("\n");
      line++;
      min = line;
    } else {
      // if no meta closing - reset to start and try to parse data without meta
      line = 1;
    }
  }

  // Scan fixtures
  while (line < max) {
    if (sep.indexOf(lines[line]) < 0) {
      line++;
      continue;
    }

    currentSep = lines[line];

    fixture = {
      type: currentSep,
      header: "",
      first: {
        text: "",
        range: [] as Array<number>,
      },
      second: {
        text: "",
        range: [] as Array<number>,
      },
    };

    line++;
    blockStart = line;

    // seek end of first block
    while (line < max && lines[line] !== currentSep) {
      line++;
    }
    if (line >= max) {
      break;
    }

    fixture.first.text = fixLF(lines.slice(blockStart, line).join("\n"));
    fixture.first.range.push(blockStart, line);
    line++;
    blockStart = line;

    // seek end of second block
    while (line < max && lines[line] !== currentSep) {
      line++;
    }
    if (line >= max) {
      break;
    }

    fixture.second.text = fixLF(lines.slice(blockStart, line).join("\n"));
    fixture.second.range.push(blockStart, line);
    line++;

    // Look back for header on 2 lines before texture blocks
    i = fixture.first.range[0] - 2;
    while (i >= Math.max(min, fixture.first.range[0] - 3)) {
      l = lines[i];
      if (sep.indexOf(l) >= 0) {
        break;
      }
      if (l.trim().length) {
        fixture.header = l.trim();
        break;
      }
      i--;
    }

    result.fixtures.push(fixture);
  }

  return result.meta || result.fixtures.length ? result : null;
}

// Read fixtures recursively, and run iterator on parsed content
//
// Options
//
// - sep (String|Array) - allowed fixture separator(s)
//
// Parsed data fields:
//
// - file (String): file name
// - meta (Mixed):  metadata from header, if exists
// - fixtures
//
function load(
  path: string,
  options: string | Array<string> | ((data: ParsedData) => void),
  iterator?: (data: ParsedData) => void,
) {
  let input, parsed;
  const stat = statSync(path);

  const normalizedOptions = {
    sep: ["."],
  };

  if (isFunction(options)) {
    iterator = options;
  } else if (isString(options)) {
    normalizedOptions.sep = options.split("");
  } else if (isArray(options)) {
    normalizedOptions.sep = options;
  }

  if (stat.isFile()) {
    input = readFileSync(path, "utf8");

    parsed = parse(input, normalizedOptions);

    if (!parsed) {
      return null;
    }

    parsed.file = path;
    try {
      // @ts-expect-error no-check
      parsed.meta = yaml.load((parsed.meta as string | null) ?? "");
    } catch {
      parsed.meta = null;
    }

    if (iterator) {
      iterator(parsed);
    }
    return parsed;
  }

  let result: Array<ParsedData>, res;
  if (stat.isDirectory()) {
    result = [];

    readdirSync(path).forEach((name) => {
      res = load(join(path, name), options, iterator);
      if (Array.isArray(res)) {
        result = result.concat(res);
      } else if (res) {
        result.push(res);
      }
    });

    return result;
  }

  // Silently other entries (symlinks and so on)
  return null;
}

function generate(path: string, md: MarkdownIt) {
  load(path, function (data) {
    data.meta = data.meta || {};
    const recordMeta = data.meta as Record<string, string>;

    const desc = recordMeta.desc || relative(path, data.file);

    (recordMeta.skip ? describe.skip : describe)(desc, () => {
      data.fixtures.forEach(function (fixture) {
        it(
          fixture.header
            ? fixture.header
            : "line " + (fixture.first.range[0] - 1),
          async () => {
            await expect(md.render(fixture.first.text)).resolves.toBe(
              fixture.second.text,
            );
          },
        );
      });
    });
  });
}

export default generate;
export { load };
