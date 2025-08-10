import {
  decodeHTML,
  decodeXML,
  DecodingMode,
  DecodingModeType,
} from "./decode";
import { encodeHTML, encodeNonAsciiHTML } from "./encode";
import { encodeXML, escapeAttribute, escapeText, escapeUTF8 } from "./escape";

/** The level of entities to support. */
export const EntityLevel = {
  /** Support only XML entities. */
  XML: 0,
  /** Support HTML entities, which are a superset of XML entities. */
  HTML: 1,
} as const;

export type EntityLevelType = (typeof EntityLevel)[keyof typeof EntityLevel];

export const EncodingMode = {
  /**
   * The output is UTF-8 encoded. Only characters that need escaping within
   * XML will be escaped.
   */
  UTF8: 0,
  /**
   * The output consists only of ASCII characters. Characters that need
   * escaping within HTML, and characters that aren't ASCII characters will
   * be escaped.
   */
  ASCII: 1,
  /**
   * Encode all characters that have an equivalent entity, as well as all
   * characters that are not ASCII characters.
   */
  Extensive: 2,
  /**
   * Encode all characters that have to be escaped in HTML attributes,
   * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
   */
  Attribute: 3,
  /**
   * Encode all characters that have to be escaped in HTML text,
   * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
   */
  Text: 4,
} as const;

export type EncodingModeType = (typeof EncodingMode)[keyof typeof EncodingMode];

export interface DecodingOptions {
  /**
   * The level of entities to support.
   * @default {@link EntityLevel.XML}
   */
  level?: EntityLevelType;
  /**
   * Decoding mode. If `Legacy`, will support legacy entities not terminated
   * with a semicolon (`;`).
   *
   * Always `Strict` for XML. For HTML, set this to `true` if you are parsing
   * an attribute value.
   *
   * The deprecated `decodeStrict` function defaults this to `Strict`.
   *
   * @default {@link DecodingMode.Legacy}
   */
  mode?: DecodingModeType | undefined;
}

/**
 * Decodes a string with entities.
 *
 * @param input String to decode.
 * @param options Decoding options.
 */
export function decode(
  input: string,
  options: DecodingOptions | EntityLevelType = EntityLevel.XML,
): string {
  const level = typeof options === "number" ? options : options.level;

  if (level === EntityLevel.HTML) {
    const mode = typeof options === "object" ? options.mode : undefined;
    return decodeHTML(input, mode);
  }

  return decodeXML(input);
}

/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param input String to decode.
 * @param options Decoding options.
 * @deprecated Use `decode` with the `mode` set to `Strict`.
 */
export function decodeStrict(
  input: string,
  options: DecodingOptions | EntityLevelType = EntityLevel.XML,
): string {
  const normalizedOptions =
    typeof options === "number" ? { level: options } : options;
  normalizedOptions.mode ??= DecodingMode.Strict;

  return decode(input, normalizedOptions);
}

/**
 * Options for `encode`.
 */
export interface EncodingOptions {
  /**
   * The level of entities to support.
   * @default {@link EntityLevel.XML}
   */
  level?: EntityLevelType;
  /**
   * Output format.
   * @default {@link EncodingMode.Extensive}
   */
  mode?: EncodingModeType;
}

/**
 * Encodes a string with entities.
 *
 * @param input String to encode.
 * @param options Encoding options.
 */
export function encode(
  input: string,
  options: EncodingOptions | EntityLevelType = EntityLevel.XML,
): string {
  const { mode = EncodingMode.Extensive, level = EntityLevel.XML } =
    typeof options === "number" ? { level: options } : options;

  switch (mode) {
    case EncodingMode.UTF8: {
      return escapeUTF8(input);
    }
    case EncodingMode.Attribute: {
      return escapeAttribute(input);
    }
    case EncodingMode.Text: {
      return escapeText(input);
    }
    case EncodingMode.ASCII: {
      return level === EntityLevel.HTML
        ? encodeNonAsciiHTML(input)
        : encodeXML(input);
    }
    case EncodingMode.Extensive:
    default: {
      return level === EntityLevel.HTML ? encodeHTML(input) : encodeXML(input);
    }
  }
}

export {
  decodeHTML,
  // Legacy aliases (deprecated)
  decodeHTML as decodeHTML4,
  decodeHTMLStrict as decodeHTML4Strict,
  decodeHTML as decodeHTML5,
  decodeHTMLStrict as decodeHTML5Strict,
  decodeHTMLAttribute,
  decodeHTMLStrict,
  decodeXML,
  decodeXML as decodeXMLStrict,
  DecodingMode,
  EntityDecoder,
} from "./decode.js";
export {
  encodeHTML,
  // Legacy aliases (deprecated)
  encodeHTML as encodeHTML4,
  encodeHTML as encodeHTML5,
  encodeNonAsciiHTML,
} from "./encode.js";
export {
  encodeXML,
  escape,
  escapeAttribute,
  escapeText,
  escapeUTF8,
} from "./escape.js";
