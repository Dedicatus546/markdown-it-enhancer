// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
export const protocolPattern = /^([a-z0-9.+-]+:)/i;
export const portPattern = /:[0-9]*$/;

// Special case for a simple path URL
/* eslint-disable-next-line no-useless-escape */
export const simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;

// RFC 2396: characters reserved for delimiting URLs.
// We actually just auto-escape these.
export const delims = ["<", ">", '"', "`", " ", "\r", "\n", "\t"];

// RFC 2396: characters not allowed for various reasons.
export const unwise = ["{", "}", "|", "\\", "^", "`"].concat(delims);

// Allowed by RFCs, but cause of XSS attacks.  Always escape these.
export const autoEscape = ["'"].concat(unwise);
// Characters that are never ever allowed in a hostname.
// Note that any invalid chars are also handled, but these
// are the ones that are *expected* to be seen, so we fast-path
// them.
export const nonHostChars = ["%", "/", "?", ";", "#"].concat(autoEscape);
export const hostEndingChars = ["/", "?", "#"];
export const hostnameMaxLen = 255;
export const hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
export const hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
// protocols that can allow "unsafe" and "unwise" chars.
// protocols that never have a hostname.
export const hostlessProtocol: Record<string, boolean> = {
  javascript: true,
  "javascript:": true,
};
// protocols that always contain a // bit.
export const slashedProtocol: Record<string, boolean> = {
  http: true,
  https: true,
  ftp: true,
  gopher: true,
  file: true,
  "http:": true,
  "https:": true,
  "ftp:": true,
  "gopher:": true,
  "file:": true,
};
