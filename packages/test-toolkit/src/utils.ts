const toString = (obj: unknown): string => {
  return Object.prototype.toString.call(obj);
};

export const isString = (obj: unknown): obj is string => {
  return toString(obj) === "[object String]";
};

export const isFunction = (
  obj: unknown,
): obj is (...args: unknown[]) => unknown => {
  return toString(obj) === "[object Function]";
};

export const isArray = (obj: unknown): obj is Array<unknown> => {
  return toString(obj) === "[object Array]";
};

export const fixLF = (str: string) => {
  return str.length ? str + "\n" : str;
};
