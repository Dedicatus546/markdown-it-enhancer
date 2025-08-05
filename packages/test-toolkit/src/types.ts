export interface ParsedData {
  fixtures: Array<{
    type: string;
    header: string;
    first: {
      text: string;
      range: Array<number>;
    };
    second: {
      text: string;
      range: Array<number>;
    };
  }>;
  meta: string | Record<string, unknown> | null;
  file: string;
}
