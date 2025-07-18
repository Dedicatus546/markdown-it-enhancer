import { describe, it, assert } from "vitest";
import fs from "fs";
import p from "path";
import yaml from "js-yaml";
import MarkdownIt from "../lib";

const assign = Object.assign;

function toString(obj: unknown): string {
  return Object.prototype.toString.call(obj);
}

function isString(obj: unknown): obj is string {
  return toString(obj) === "[object String]";
}
function isFunction(obj: unknown): obj is (...args: any[]) => any {
  return toString(obj) === "[object Function]";
}
function isArray(obj: unknown): obj is Array<unknown> {
  return toString(obj) === "[object Array]";
}

function fixLF(str: string) {
  return str.length ? str + "\n" : str;
}

function parse(input, options) {
  const lines = input.split(/\r?\n/g),
    max = lines.length;
  let min = 0,
    line = 0,
    fixture,
    i,
    l,
    currentSep,
    blockStart;

  const result = {
    fixtures: [] as Array<any>,
    meta: "",
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
        range: [],
      },
      second: {
        text: "",
        range: [],
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
function load(path, options, iterator) {
  let input, parsed;
  const stat = fs.statSync(path);

  if (isFunction(options)) {
    iterator = options;
    options = { sep: ["."] };
  } else if (isString(options)) {
    options = { sep: options.split("") };
  } else if (isArray(options)) {
    options = { sep: options };
  }

  if (stat.isFile()) {
    input = fs.readFileSync(path, "utf8");

    parsed = parse(input, options);

    if (!parsed) {
      return null;
    }

    parsed.file = path;
    try {
      parsed.meta = yaml.load(parsed.meta || "");
    } catch {
      parsed.meta = null;
    }

    if (iterator) {
      iterator(parsed);
    }
    return parsed;
  }

  let result, res;
  if (stat.isDirectory()) {
    result = [];

    fs.readdirSync(path).forEach(function (name) {
      res = load(p.join(path, name), options, iterator);
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

function generate(path: string, options: any, md: MarkdownIt) {
  if (!md) {
    md = options;
    options = {};
  }

  options = assign({}, options);
  options.assert = options.assert || assert;

  load(path, options, function (data) {
    data.meta = data.meta || {};

    const desc = data.meta.desc || p.relative(path, data.file);

    (data.meta.skip ? describe.skip : describe)(desc, function () {
      data.fixtures.forEach(function (fixture) {
        it(
          fixture.header && options.header
            ? fixture.header
            : "line " + (fixture.first.range[0] - 1),
          function () {
            options.assert.strictEqual(
              md.render(fixture.first.text),
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
