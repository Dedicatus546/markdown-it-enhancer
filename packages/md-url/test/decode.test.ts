import { describe, expect, it } from "vitest";

import { decode } from "../src";

const encodeBinary = (str: string) => {
  let result = "";

  str = str.replace(/\s+/g, "");
  while (str.length) {
    result =
      "%" + ("0" + parseInt(str.slice(-8), 2).toString(16)).slice(-2) + result;
    str = str.slice(0, -8);
  }

  return result;
};

const samples = {
  "00000000": true,
  "01010101": true,
  "01111111": true,

  // invalid as 1st byte
  10000000: true,
  10111111: true,

  // invalid sequences, 2nd byte should be >= 0x80
  "11000111 01010101": false,
  "11100011 01010101": false,
  "11110001 01010101": false,

  // invalid sequences, 2nd byte should be < 0xc0
  "11000111 11000000": false,
  "11100011 11000000": false,
  "11110001 11000000": false,

  // invalid 3rd byte
  "11100011 10010101 01010101": false,
  "11110001 10010101 01010101": false,

  // invalid 4th byte
  "11110001 10010101 10010101 01010101": false,

  // valid sequences
  "11000111 10101010": true,
  "11100011 10101010 10101010": true,
  "11110001 10101010 10101010 10101010": true,

  // minimal chars with given length
  "11000010 10000000": true,
  "11100000 10100000 10000000": true,

  // impossible sequences
  "11000001 10111111": false,
  "11100000 10011111 10111111": false,
  "11000001 10000000": false,
  "11100000 10010000 10000000": false,

  // maximum chars with given length
  "11011111 10111111": true,
  "11101111 10111111 10111111": true,

  "11110000 10010000 10000000 10000000": true,
  "11110000 10010000 10001111 10001111": true,
  "11110100 10001111 10110000 10000000": true,
  "11110100 10001111 10111111 10111111": true,

  // too low
  "11110000 10001111 10111111 10111111": false,

  // too high
  "11110100 10010000 10000000 10000000": false,
  "11110100 10011111 10111111 10111111": false,

  // surrogate range
  "11101101 10011111 10111111": true,
  "11101101 10100000 10000000": false,
  "11101101 10111111 10111111": false,
  "11101110 10000000 10000000": true,
};

describe("decode", () => {
  it("should decode %xx", () => {
    expect(decode("x%20xx%20%2520")).toBe("x xx %20");
  });

  it("should not decode invalid sequences", () => {
    expect(decode("%2g%z1%%")).toBe("%2g%z1%%");
  });

  it("should not decode reservedSet", () => {
    expect(decode("%20%25%20", "%")).toBe(" %25 ");
    expect(decode("%20%25%20", " ")).toBe("%20%%20");
    expect(decode("%20%25%20", " %")).toBe("%20%25%20");
  });

  describe("utf8", () => {
    Object.keys(samples).forEach(function (k) {
      it(k, () => {
        let res1, er;

        const str = encodeBinary(k);

        try {
          res1 = decodeURIComponent(str);
        } catch (e) {
          er = e;
        }

        const res2 = decode(str);

        if (er) {
          expect(res2.indexOf("\ufffd")).not.toBe(-1);
        } else {
          expect(res1, res2);
          expect(res2.indexOf("\ufffd")).toBe(-1);
        }
      });
    });
  });
});
