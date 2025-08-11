// Markdown-it plugin to render GitHub-style task lists; see
//
// https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments
// https://github.com/blog/1825-task-lists-in-all-markdown-documents

import type { MarkdownItPlugin, TokenAttr } from "markdown-it-enhancer";
import { Token } from "markdown-it-enhancer";

import type { TaskListsNormalizedOptions, TaskListsOptions } from "./types";

const defaultOptions: TaskListsNormalizedOptions = {
  enabled: false,
  label: false,
  labelAfter: false,
};

export const taskLists: MarkdownItPlugin<[options?: TaskListsOptions]> = (
  md,
  options,
) => {
  const normalizedOptions = Object.assign({}, defaultOptions, options);

  md.core.ruler.after("inline", "github-task-lists", (state) => {
    const tokens = state.tokens;
    for (let i = 2; i < tokens.length; i++) {
      if (isTodoItem(tokens, i)) {
        todoify(tokens[i], normalizedOptions);
        attrSet(
          tokens[i - 2],
          "class",
          "task-list-item" + (normalizedOptions.enabled ? " enabled" : ""),
        );
        attrSet(
          tokens[parentToken(tokens, i - 2)],
          "class",
          "contains-task-list",
        );
      }
    }
  });
};

const attrSet = (token: Token, name: string, value: string) => {
  const index = token.attrIndex(name);
  const attr: TokenAttr = [name, value];

  if (index < 0) {
    token.attrPush(attr);
  }
  else {
    token.attrs![index] = attr;
  }
};

const parentToken = (tokens: Array<Token>, index: number) => {
  const targetLevel = tokens[index].level - 1;
  for (let i = index - 1; i >= 0; i--) {
    if (tokens[i].level === targetLevel) {
      return i;
    }
  }
  return -1;
};

const isTodoItem = (tokens: Array<Token>, index: number) => {
  return (
    isInline(tokens[index])
    && isParagraph(tokens[index - 1])
    && isListItem(tokens[index - 2])
    && startsWithTodoMarkdown(tokens[index])
  );
};

const todoify = (token: Token, options: TaskListsNormalizedOptions) => {
  token.children.unshift(makeCheckbox(token, options.enabled));
  token.children[1].content = token.children[1].content.slice(3);
  token.content = token.content.slice(3);

  if (options.label) {
    if (options.labelAfter) {
      token.children.pop();

      // Use large random number as id property of the checkbox.
      const id
        = "task-item-" + Math.ceil(Math.random() * (10000 * 1000) - 1000);
      token.children[0].content
        = token.children[0].content.slice(0, -1) + " id=\"" + id + "\">";
      token.children.push(afterLabel(token.content, id));
    }
    else {
      token.children.unshift(beginLabel());
      token.children.push(endLabel());
    }
  }
};

const makeCheckbox = (token: Token, enabled: boolean) => {
  const checkbox = new Token("html_inline", "", 0);
  const disabledAttr = !enabled ? " disabled=\"\" " : " ";
  if (token.content.indexOf("[ ] ") === 0) {
    checkbox.content
      = "<input class=\"task-list-item-checkbox\""
        + disabledAttr
        + "type=\"checkbox\">";
  }
  else if (
    token.content.indexOf("[x] ") === 0
    || token.content.indexOf("[X] ") === 0
  ) {
    checkbox.content
      = "<input class=\"task-list-item-checkbox\" checked=\"\""
        + disabledAttr
        + "type=\"checkbox\">";
  }
  return checkbox;
};

// these next two functions are kind of hacky; probably should really be a
// true block-level token with .tag=='label'
const beginLabel = () => {
  const token = new Token("html_inline", "", 0);
  token.content = "<label>";
  return token;
};

const endLabel = () => {
  const token = new Token("html_inline", "", 0);
  token.content = "</label>";
  return token;
};

const afterLabel = (content: string, id: string) => {
  // TODO
  const token = new Token("html_inline", "", 0);
  token.content
    = "<label class=\"task-list-item-label\" for=\""
      + id
      + "\">"
      + content
      + "</label>";
  token.attrPush(["for", id]);
  return token;
};

const isInline = (token: Token) => token.type === "inline";
const isParagraph = (token: Token) => token.type === "paragraph_open";
const isListItem = (token: Token) => token.type === "list_item_open";

// leading whitespace in a list item is already trimmed off by markdown-it
const startsWithTodoMarkdown = (token: Token) =>
  token.content.indexOf("[ ] ") === 0
  || token.content.indexOf("[x] ") === 0
  || token.content.indexOf("[X] ") === 0;
