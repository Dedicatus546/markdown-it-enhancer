// Convert input options to more useable format
// and compile search regexp

import { EmojiNormalizedOptions, EmojiOptions } from "./types";

const quoteRE = (str: string) => {
  return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

const defaultOptions: Required<EmojiOptions> = {
  defs: {},
  shortcuts: {},
  enabled: [],
};

export const normalizeOptions = (
  options: EmojiOptions = {},
): EmojiNormalizedOptions => {
  const opts = Object.assign({}, defaultOptions, options);

  // Filter emojies by whitelist, if needed
  const emojies =
    opts.enabled.length <= 0
      ? opts.defs
      : Object.keys(opts.defs).reduce<Required<EmojiOptions>["defs"]>(
          (acc, key) => {
            if (opts.enabled.includes(key)) {
              acc[key] = opts.defs[key];
            }
            return acc;
          },
          {},
        );

  // Flatten shortcuts to simple object: { alias: emoji_name }
  const shortcuts = Object.keys(opts.shortcuts).reduce<Record<string, string>>(
    (acc, key) => {
      // Skip aliases for filtered emojies, to reduce regexp
      if (!emojies[key]) return acc;

      if (Array.isArray(opts.shortcuts[key])) {
        opts.shortcuts[key].forEach((alias) => {
          acc[alias] = key;
        });
        return acc;
      }

      acc[opts.shortcuts[key]] = key;
      return acc;
    },
    {},
  );

  const keys = Object.keys(emojies);
  let names;

  // If no definitions are given, return empty regex to avoid replacements with 'undefined'.
  if (keys.length === 0) {
    names = "^$";
  } else {
    // Compile regexp
    names = keys
      .map((name) => {
        return `:${name}:`;
      })
      .concat(Object.keys(shortcuts))
      .sort()
      .reverse()
      .map((name) => {
        return quoteRE(name);
      })
      .join("|");
  }
  const scanRE = RegExp(names);
  const replaceRE = RegExp(names, "g");

  return {
    defs: emojies,
    shortcuts,
    scanRE,
    replaceRE,
  };
};
