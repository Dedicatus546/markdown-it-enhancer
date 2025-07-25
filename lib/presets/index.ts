import { Awaitable } from "../../lib/types";
import commonmarkPreset from "./commonmark";
import defaultPreset from "./default";
import zeroPreset from "./zero";

export interface Preset {
  options: {
    html: boolean;
    xhtmlOut: boolean;
    breaks: boolean;
    langPrefix: string;
    linkify: boolean;
    typographer: boolean;
    quotes: Array<string> | string;
    highlight:
      | ((str: string, lang: string, langAttrs: string) => Awaitable<string>)
      | null;
    maxNesting: number;
  };
  components: {
    core: {
      rules?: Array<string>;
    };
    block: {
      rules?: Array<string>;
    };
    inline: {
      rules?: Array<string>;
      rules2?: Array<string>;
    };
  };
}

export type PresetName = keyof typeof presets;

export const presets = {
  default: defaultPreset,
  zero: zeroPreset,
  commonmark: commonmarkPreset,
} as const;

export const isValidPresetName = (
  presetName: string,
): presetName is PresetName => {
  return Object.keys(presets).includes(presetName);
};
