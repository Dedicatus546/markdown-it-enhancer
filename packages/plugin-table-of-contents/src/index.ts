/*
* markdown-it-table-of-contents
*
* The algorithm works as follows:
* Step 1: Gather all headline tokens from a Markdown document and put them in an array.
* Step 2: Turn the flat array into a nested tree, respecting the correct headline level.
* Step 3: Turn the nested tree into HTML code.
*/

import { MarkdownIt, MarkdownItPlugin, StateBlockRuleFn, Token } from "@markdown-it-enhancer/core";

import type { HeadlineItem, TableOfContentsNormalizedOptions, TableOfContentsOptions, TocItem } from "./types";

// --- Default helpers and options ---

/**
 * Slugify a string to be used as anchor
 * @param text Text to slugify
 * @returns Slugified anchor string
 */
const slugify = (text: string) => {
  return encodeURIComponent(String(text).trim().toLowerCase().replace(/\s+/g, "-"));
};

/**
 * Default formatter for headline text
 * @param content Text content of the headline
 * @param md Markdown-it instance
 * @returns Formatted content
 */
const format = async (content: string, md: MarkdownIt) => {
  return md.renderInline(content);
};

/**
 * Generates the opening HTML for a container with a specified class and optional header HTML.
 * @param containerClass The CSS class to apply to the container div
 * @param containerHeaderHtml Optional HTML to include as the container's header
 * @returns HTML string
 */
const transformContainerOpen = (containerClass: string, containerHeaderHtml: string) => {
  let tocOpenHtml = "<div class=\"" + containerClass + "\">";
  if (containerHeaderHtml) {
    tocOpenHtml += containerHeaderHtml;
  }
  return tocOpenHtml;
};

/**
 * Generates the closing HTML / footer for a container
 * @param The HTML string to be used for closing the container
 * @returns HTML string
 */
const transformContainerClose = (containerFooterHtml: string) => {
  let tocFooterHtml = "";
  if (containerFooterHtml) {
    tocFooterHtml = containerFooterHtml;
  }
  return tocFooterHtml + "</div>";
};

/**
 * Helper to extract text from tokens, same function as in markdown-it-anchor
 * @param tokens Tokens
 */
const getTokensText = (tokens: Array<Token>) => {
  return tokens
    .filter(t => ["text", "code_inline"].includes(t.type))
    .map(t => t.content)
    .join("")
    .trim();
};

const defaultOptions: TableOfContentsNormalizedOptions = {
  includeLevel: [1, 2],
  containerClass: "table-of-contents",
  slugify,
  markerPattern: /^\[\[toc\]\]/im,
  omitTag: "<!-- omit from toc -->",
  listType: "ul",
  format,
  containerHeaderHtml: undefined,
  containerFooterHtml: undefined,
  transformLink: undefined,
  transformContainerOpen,
  transformContainerClose,
  getTokensText,
};

// --- TOC builder ---

/**
* Finds all headline items for the defined levels in a Markdown document.
* @param levels includeLevels like `[1, 2, 3]`
* @param tokens Tokens gathered by the plugin
* @param options Plugin options
*/
const findHeadlineElements = (levels: Array<number>, tokens: Array<Token>, options: TableOfContentsNormalizedOptions) => {
  const headings: Array<HeadlineItem> = [];
  let currentHeading: HeadlineItem | null = null;

  tokens.forEach((/** @type {*} */ token, /** @type {number} */ index) => {
    if (token.type === "heading_open") {
      const prev = index > 0 ? tokens[index - 1] : null;
      if (prev && prev.type === "html_block" && prev.content.trim().toLowerCase().replace("\n", "") === options.omitTag) {
        return;
      }
      const id = findExistingIdAttr(token);
      const level = parseInt(token.tag.toLowerCase().replace("h", ""), 10);
      if (levels.indexOf(level) >= 0) {
        currentHeading = {
          level: level,
          text: "",
          anchor: id || null,
          token: null,
        };
      }
    }
    else if (currentHeading && token.type === "inline") {
      const textContent = options.getTokensText(token.children, token);
      currentHeading.text = textContent;
      currentHeading.token = token;
      if (!currentHeading.anchor) {
        currentHeading.anchor = options.slugify(textContent, token);
      }
    }
    else if (token.type === "heading_close") {
      if (currentHeading) {
        headings.push(currentHeading);
      }
      currentHeading = null;
    }
  });

  return headings;
};

/**
* Helper to find an existing id attr on a token. Should be a heading_open token, but could be anything really
* Provided by markdown-it-anchor or markdown-it-attrs
* @param token Token
* @returns Id attribute to use as anchor
*/
const findExistingIdAttr = (token: Token) => {
  if (token && token.attrs && token.attrs.length > 0) {
    const idAttr = token.attrs.find((/** @type {string | any[]} */ attr) => {
      if (Array.isArray(attr) && attr.length >= 2) {
        return attr[0] === "id";
      }
      return false;
    });
    if (idAttr && Array.isArray(idAttr) && idAttr.length >= 2) {
      const [, val] = idAttr;
      return val;
    }
  }
  return null;
};

/**
* Helper to get minimum headline level so that the TOC is nested correctly
* @param headlineItems these
* @returns Minimum level
*/
const getMinLevel = (headlineItems: Array<HeadlineItem>) => {
  return Math.min(...headlineItems.map(item => item.level));
};

/**
* Helper that creates a TOCItem
*/
const addListItem = (level: number, text: string, anchor: string | null, rootNode: TocItem) => {
  const listItem: TocItem = { level, text, anchor, children: [], parent: rootNode };
  rootNode.children.push(listItem);
  return listItem;
};

/**
* Turns a list of flat headline items into a nested tree object representing the TOC
* @returns Tree of TOC items
*/
const flatHeadlineItemsToNestedTree = (headlineItems: Array<HeadlineItem>) => {
  // create a root node with no text that holds the entire TOC. this won't be rendered, but only its children
  const toc: TocItem = { level: getMinLevel(headlineItems) - 1, anchor: null, text: "", children: [], parent: null };
  // pointer that tracks the last root item of the current list
  let currentRootNode = toc;
  // pointer that tracks the last item (to turn it into a new root node if necessary)
  let prevListItem = currentRootNode;

  headlineItems.forEach((headlineItem) => {
    // if level is bigger, take the previous node, add a child list, set current list to this new child list
    if (headlineItem.level > prevListItem.level) {
      Array.from({ length: headlineItem.level - prevListItem.level }).forEach(() => {
        currentRootNode = prevListItem;
        prevListItem = addListItem(headlineItem.level, "", null, currentRootNode);
      });
      prevListItem.text = headlineItem.text;
      prevListItem.anchor = headlineItem.anchor;
    }
    // if level is same, add to the current list
    else if (headlineItem.level === prevListItem.level) {
      prevListItem = addListItem(headlineItem.level, headlineItem.text, headlineItem.anchor, currentRootNode);
    }
    // if level is smaller, set current list to currentlist.parent
    else if (headlineItem.level < prevListItem.level) {
      for (let i = 0; i < prevListItem.level - headlineItem.level; i++) {
        if (currentRootNode.parent) {
          currentRootNode = currentRootNode.parent;
        }
      }
      prevListItem = addListItem(headlineItem.level, headlineItem.text, headlineItem.anchor, currentRootNode);
    }
  });

  return toc;
};

/**
 * Recursively turns a nested tree of tocItems to HTML
 */
const tocItemToHtml = async (tocItem: TocItem, options: TableOfContentsNormalizedOptions, md: MarkdownIt): Promise<string> => {
  const r = await Promise.all(
    tocItem.children.map(async (childItem) => {
      let li = "<li>";
      let anchor = childItem.anchor;
      if (options.transformLink) {
        anchor = options.transformLink(anchor);
      }

      const text = childItem.text ? await options.format(childItem.text, md, anchor) : null;

      li += anchor
        ? `<a href="#${anchor}">${text}</a>`
        : (text ?? "");

      return li + (childItem.children.length > 0 ? await tocItemToHtml(childItem, options, md) : "") + "</li>";
    }),
  );
  return "<" + options.listType + ">" + r.join("") + "</" + options.listType + ">";
};

export const tableOfContents: MarkdownItPlugin<[options?: TableOfContentsOptions]> = (md, options) => {
  const normalizedOptions = Object.assign({}, defaultOptions, options);
  const tocRegexp = normalizedOptions.markerPattern;

  /**
  * Markdown-it block rule to find [[toc]] markers
  */
  const toc: StateBlockRuleFn = (state, startLine, endLine, silent) => {
    let token;
    let match;
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    // Reject if the token does not start with [
    if (state.src.charCodeAt(start) !== 0x5B /* [ */) {
      return false;
    }

    // Detect [[toc]] markup
    match = tocRegexp.exec(state.src.substring(start, max));
    match = !match
      ? []
      : match.filter(m => m);
    if (match.length < 1) {
      return false;
    }

    if (silent) {
      return true;
    }

    state.line = startLine + 1;

    // Build content
    token = state.push("toc_open", "toc", 1);
    token.markup = "[[toc]]";
    token.map = [startLine, state.line];

    token = state.push("toc_body", "", 0);
    token.markup = "";
    token.map = [startLine, state.line];
    token.children = [];

    token = state.push("toc_close", "toc", -1);
    token.markup = "";

    return true;
  };

  md.renderer.rules.toc_open = () => {
    return normalizedOptions.transformContainerOpen(normalizedOptions.containerClass, normalizedOptions.containerHeaderHtml);
  };

  md.renderer.rules.toc_close = () => {
    return normalizedOptions.transformContainerClose(normalizedOptions.containerFooterHtml) + "\n";
  };

  md.renderer.rules.toc_body = async (tokens) => {
    const headlineItems = findHeadlineElements(normalizedOptions.includeLevel, tokens, normalizedOptions);
    const tocTree = flatHeadlineItemsToNestedTree(headlineItems);
    const html = await tocItemToHtml(tocTree, normalizedOptions, md);
    return html;
  };

  md.block.ruler.before("heading", "toc", toc, {
    alt: ["paragraph", "reference", "blockquote"],
  });
};
