export const toString = (obj: unknown): string => {
  return Object.prototype.toString.call(obj);
};

export const isString = (obj: unknown): obj is string => {
  return toString(obj) === "[object String]";
};

export const isObject = (obj: unknown): obj is object => {
  return toString(obj) === "[object Object]";
};

export const isRegExp = (obj: unknown): obj is RegExp => {
  return toString(obj) === "[object RegExp]";
};

export const isFunction = (
  obj: unknown,
): obj is (...args: unknown[]) => unknown => {
  return toString(obj) === "[object Function]";
};

export const escapeRE = (str: string) => {
  return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

export const isArray = (obj: unknown): obj is Array<unknown> => {
  return toString(obj) === "[object Array]";
};
