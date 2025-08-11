import type { Token, TokenAttr } from "markdown-it-enhancer";

export const isLevelSelectedNumber = (selection: number) => (level: number) =>
  level >= selection;

export const isLevelSelectedArray
  = (selection: Array<number>) => (level: number) =>
    selection.includes(level);

export const slugify = (s: string) =>
  encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, "-"));

export const getTokensText = (tokens: Array<Token>) => {
  return tokens
    .filter(t => ["text", "code_inline"].includes(t.type))
    .map(t => t.content)
    .join("");
};

export const uniqueIdValue = (
  idValue: string,
  idValueMap: Record<string, boolean>,
  failOnNonUnique: boolean,
  startIndex: number,
) => {
  let uniqueIdValue = idValue;
  let i = startIndex;

  if (failOnNonUnique && Object.hasOwn(idValueMap, uniqueIdValue)) {
    throw new Error(
      `User defined \`id\` attribute \`${idValue}\` is not unique. Please fix it in your Markdown to continue.`,
    );
  }
  else {
    while (Object.hasOwn(idValueMap, uniqueIdValue)) {
      uniqueIdValue = `${idValue}-${i}`;
      i += 1;
    }
  }

  idValueMap[uniqueIdValue] = true;

  return uniqueIdValue;
};

export const mergeDuplicateClassAttrs = (attrs: TokenAttr[]): TokenAttr[] => {
  const classValues: Array<string> = [];
  const withoutClassAttrs = attrs.filter(([key]) => key !== "class");

  attrs.forEach(([key, value]) => {
    if (key === "class") {
      classValues.push(value);
    }
  });

  if (classValues.length > 0) {
    return [["class", classValues.join(" ")], ...withoutClassAttrs];
  }

  return withoutClassAttrs;
};
