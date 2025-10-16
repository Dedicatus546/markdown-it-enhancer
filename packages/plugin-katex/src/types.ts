import type { KatexOptions } from "katex";

export type MathOptions = KatexOptions;

export interface IsValidDelimResult {
  can_open: boolean
  can_close: boolean
}
