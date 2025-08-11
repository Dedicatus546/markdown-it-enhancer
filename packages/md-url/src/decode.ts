const decodeCache: Record<string, Array<string>> = {};

const getDecodeCache = (exclude: string) => {
  let cache = decodeCache[exclude];
  if (cache) {
    return cache;
  }

  cache = decodeCache[exclude] = [];

  for (let i = 0; i < 128; i++) {
    const ch = String.fromCharCode(i);
    cache.push(ch);
  }

  for (let i = 0; i < exclude.length; i++) {
    const ch = exclude.charCodeAt(i);
    cache[ch] = "%" + ("0" + ch.toString(16).toUpperCase()).slice(-2);
  }

  return cache;
};

// Decode percent-encoded string.
//
export const decode = (str: string, exclude?: string) => {
  if (typeof exclude !== "string") {
    exclude = decode.defaultChars;
  }

  const cache = getDecodeCache(exclude);

  return str.replace(/(%[a-f0-9]{2})+/gi, function (seq) {
    let result = "";

    for (let i = 0, l = seq.length; i < l; i += 3) {
      const b1 = parseInt(seq.slice(i + 1, i + 3), 16);

      if (b1 < 0x80) {
        result += cache[b1];
        continue;
      }

      if ((b1 & 0xe0) === 0xc0 && i + 3 < l) {
        // 110xxxxx 10xxxxxx
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);

        if ((b2 & 0xc0) === 0x80) {
          const chr = ((b1 << 6) & 0x7c0) | (b2 & 0x3f);

          if (chr < 0x80) {
            result += "\ufffd\ufffd";
          }
          else {
            result += String.fromCharCode(chr);
          }

          i += 3;
          continue;
        }
      }

      if ((b1 & 0xf0) === 0xe0 && i + 6 < l) {
        // 1110xxxx 10xxxxxx 10xxxxxx
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        const b3 = parseInt(seq.slice(i + 7, i + 9), 16);

        if ((b2 & 0xc0) === 0x80 && (b3 & 0xc0) === 0x80) {
          const chr = ((b1 << 12) & 0xf000) | ((b2 << 6) & 0xfc0) | (b3 & 0x3f);

          if (chr < 0x800 || (chr >= 0xd800 && chr <= 0xdfff)) {
            result += "\ufffd\ufffd\ufffd";
          }
          else {
            result += String.fromCharCode(chr);
          }

          i += 6;
          continue;
        }
      }

      if ((b1 & 0xf8) === 0xf0 && i + 9 < l) {
        // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        const b4 = parseInt(seq.slice(i + 10, i + 12), 16);

        if (
          (b2 & 0xc0) === 0x80
          && (b3 & 0xc0) === 0x80
          && (b4 & 0xc0) === 0x80
        ) {
          let chr
            = ((b1 << 18) & 0x1c0000)
              | ((b2 << 12) & 0x3f000)
              | ((b3 << 6) & 0xfc0)
              | (b4 & 0x3f);

          if (chr < 0x10000 || chr > 0x10ffff) {
            result += "\ufffd\ufffd\ufffd\ufffd";
          }
          else {
            chr -= 0x10000;
            result += String.fromCharCode(
              0xd800 + (chr >> 10),
              0xdc00 + (chr & 0x3ff),
            );
          }

          i += 9;
          continue;
        }
      }

      result += "\ufffd";
    }

    return result;
  });
};

decode.defaultChars = ";/?:@&=+$,#";
