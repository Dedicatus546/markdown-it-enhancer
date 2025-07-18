import * as utils from "../lib/common/utils";
import { assert, describe, it } from "vitest";

describe("Utils", function () {
  it("fromCodePoint", function () {
    const fromCodePoint = utils.fromCodePoint;

    assert.strictEqual(fromCodePoint(0x20), " ");
    assert.strictEqual(fromCodePoint(0x1f601), "😁");
  });

  it("isValidEntityCode", function () {
    const isValidEntityCode = utils.isValidEntityCode;

    assert.strictEqual(isValidEntityCode(0x20), true);
    assert.strictEqual(isValidEntityCode(0xd800), false);
    assert.strictEqual(isValidEntityCode(0xfdd0), false);
    assert.strictEqual(isValidEntityCode(0x1ffff), false);
    assert.strictEqual(isValidEntityCode(0x1fffe), false);
    assert.strictEqual(isValidEntityCode(0x00), false);
    assert.strictEqual(isValidEntityCode(0x0b), false);
    assert.strictEqual(isValidEntityCode(0x0e), false);
    assert.strictEqual(isValidEntityCode(0x7f), false);
  });

  /* it('replaceEntities', function () {
    var replaceEntities = utils.replaceEntities;

    assert.strictEqual(replaceEntities('&amp;'), '&');
    assert.strictEqual(replaceEntities('&#32;'), ' ');
    assert.strictEqual(replaceEntities('&#x20;'), ' ');
    assert.strictEqual(replaceEntities('&amp;&amp;'), '&&');

    assert.strictEqual(replaceEntities('&am;'), '&am;');
    assert.strictEqual(replaceEntities('&#00;'), '&#00;');
  }); */

  it("assign", function () {
    const assign = utils.assign;

    assert.deepEqual(assign({ a: 1 }, null, { b: 2 }), { a: 1, b: 2 });
  });

  it("escapeRE", function () {
    const escapeRE = utils.escapeRE;

    assert.strictEqual(
      escapeRE(" .?*+^$[]\\(){}|-"),
      " \\.\\?\\*\\+\\^\\$\\[\\]\\\\\\(\\)\\{\\}\\|\\-",
    );
  });

  it("isWhiteSpace", function () {
    const isWhiteSpace = utils.isWhiteSpace;

    assert.strictEqual(isWhiteSpace(0x2000), true);
    assert.strictEqual(isWhiteSpace(0x09), true);

    assert.strictEqual(isWhiteSpace(0x30), false);
  });

  it("isMdAsciiPunct", function () {
    const isMdAsciiPunct = utils.isMdAsciiPunct;

    assert.strictEqual(isMdAsciiPunct(0x30), false);

    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("").forEach(function (ch) {
      assert.strictEqual(isMdAsciiPunct(ch.charCodeAt(0)), true);
    });
  });

  it("unescapeMd", function () {
    const unescapeMd = utils.unescapeMd;

    assert.strictEqual(unescapeMd("\\foo"), "\\foo");
    assert.strictEqual(unescapeMd("foo"), "foo");

    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("").forEach(function (ch) {
      assert.strictEqual(unescapeMd("\\" + ch), ch);
    });
  });
});
