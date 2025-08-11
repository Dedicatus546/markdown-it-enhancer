import type { RendererFn } from "markdown-it-enhancer";

export interface ContainerOptions {
  validate?: (src: string, markup: string) => boolean
  render?: RendererFn
  marker?: string
}

export type ContainerNormalizedOptions = Required<ContainerOptions>;
