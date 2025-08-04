import { defaultOptions } from "./constants";
import type { LinkifyItOptions } from "./types";

export const isOptionsObj = (obj: unknown): obj is LinkifyItOptions => {
  return Object.keys(obj ?? {}).reduce((acc, k) => {
    return acc || Object.hasOwn(defaultOptions, k);
  }, false);
};
