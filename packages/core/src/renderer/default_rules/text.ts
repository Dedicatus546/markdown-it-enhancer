import { escapeHtml } from "../../common/utils";
import { RendererFn } from "../renderer";

export const text: RendererFn<"sync"> = (tokens, idx) =>
  escapeHtml(tokens[idx].content);
