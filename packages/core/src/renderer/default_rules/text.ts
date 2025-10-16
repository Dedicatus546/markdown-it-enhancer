import { escapeHtml } from "../../common/utils";
import { RendererFn } from "../renderer";

export const text: RendererFn = (tokens, idx) =>
  escapeHtml(tokens[idx].content);
