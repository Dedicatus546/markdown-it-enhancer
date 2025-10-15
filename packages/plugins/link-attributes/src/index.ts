import { MarkdownIt, MarkdownItPlugin, RendererFn, type Token } from "markdown-it-enhancer";

import { LinkAttributesListItem, LinkAttributesNormalizedOptions, LinkAttributesOptions } from "./types";

// Adapted from https://github.com/markdown-it/markdown-it/blob/fbc6b0fed563ba7c00557ab638fd19752f8e759d/docs/architecture.md

const findFirstMatchingConfig = (token: Token, options: LinkAttributesNormalizedOptions) => {
  let i, config;
  const href = token.attrs?.[token.attrIndex("href")][1] ?? "";

  for (i = 0; i < options.length; ++i) {
    config = options[i];

    // If there is a matcher function defined then call it
    // Matcher Function should return a boolean indicating
    // whether or not it matched. If it matched, use that
    // configuration, otherwise, try the next one.
    if (typeof config.matcher === "function") {
      if (config.matcher(href, config)) {
        return config;
      }
      else {
        continue;
      }
    }

    return config;
  }
};

const applyAttributes = (idx: number, tokens: Array<Token>, attrs: LinkAttributesListItem["attrs"] = {}) => {
  Object.keys(attrs).forEach((attr) => {
    const value = attrs[attr];

    if (attr === "className") {
      // when dealing with applying classes
      // programatically, some programmers
      // may prefer to use the className syntax
      attr = "class";
    }

    const attrIndex = tokens[idx].attrIndex(attr);

    if (attrIndex < 0) {
      // attr doesn't exist, add new attribute
      tokens[idx].attrPush([attr, value]);
    }
    else {
      // attr already exists, overwrite it
      tokens[idx].attrs![attrIndex][1] = value; // replace value of existing attr
    }
  });
};

const defaultRender: RendererFn<"sync"> = (
  tokens,
  idx,
  options,
  _env,
  self,
) => {
  return self.renderToken(tokens, idx, options);
};

export const linkAttributes: MarkdownItPlugin<[options?: LinkAttributesOptions]> & {
  defaultRender: typeof defaultRender
} = (md: MarkdownIt, options) => {
  let defaultOptions: LinkAttributesNormalizedOptions = [];
  if (options) {
    defaultOptions = Array.isArray(options) ? options.slice() : [options];
  }

  const render = md.renderer.rules.link_open ?? linkAttributes.defaultRender;

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const config = findFirstMatchingConfig(tokens[idx], defaultOptions);
    const attributes = config && config.attrs;

    if (attributes) {
      applyAttributes(idx, tokens, attributes);
    }

    // pass token to default renderer.
    return render(tokens, idx, options, env, self);
  };
};

linkAttributes.defaultRender = defaultRender;
