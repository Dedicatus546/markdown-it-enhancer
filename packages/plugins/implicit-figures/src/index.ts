import type {
  MarkdownItPlugin,
  StateCoreRuleFn,
  Token,
  TokenAttr,
} from "markdown-it-enhancer";

import {
  ImplicitFiguresNormalizedOptions,
  ImplicitFiguresOptions,
} from "./types";

export * from "./types";

const defaultOptions: ImplicitFiguresNormalizedOptions = {
  dataType: false,
  figcaption: false,
  keepAlt: false,
  lazyLoading: false,
  link: false,
  tabindex: false,
  copyAttrs: false,
};

export const implicitFigures: MarkdownItPlugin<
  [options?: ImplicitFiguresOptions]
> = (md, options) => {
  const normalizedOptions = Object.assign({}, defaultOptions, options);

  const implicitFigures: StateCoreRuleFn = async (state) => {
    // reset tabIndex on md.render()
    let tabIndex = 1;

    // do not process first and last token
    for (let i = 1, l = state.tokens.length; i < l - 1; ++i) {
      const token = state.tokens[i];

      if (token.type !== "inline") {
        continue;
      }
      // children: image alone, or link_open -> image -> link_close
      if (
        !token.children
        || (token.children.length !== 1 && token.children.length !== 3)
      ) {
        continue;
      }
      // one child, should be img
      if (token.children.length === 1 && token.children[0].type !== "image") {
        continue;
      }
      // three children, should be image enclosed in link
      if (
        token.children.length === 3
        && (token.children[0].type !== "link_open"
          || token.children[1].type !== "image"
          || token.children[2].type !== "link_close")
      ) {
        continue;
      }
      // prev token is paragraph open
      if (i !== 0 && state.tokens[i - 1].type !== "paragraph_open") {
        continue;
      }
      // next token is paragraph close
      if (i !== l - 1 && state.tokens[i + 1].type !== "paragraph_close") {
        continue;
      }

      // We have inline token containing an image only.
      // Previous token is paragraph open.
      // Next token is paragraph close.
      // Lets replace the paragraph tokens with figure tokens.
      const figure = state.tokens[i - 1];
      figure.type = "figure_open";
      figure.tag = "figure";
      state.tokens[i + 1].type = "figure_close";
      state.tokens[i + 1].tag = "figure";

      if (normalizedOptions.dataType == true) {
        state.tokens[i - 1].attrPush(["data-type", "image"]);
      }
      let image: Token;

      if (normalizedOptions.link == true && token.children.length === 1) {
        image = token.children[0];
        const aToken = new state.Token("link_open", "a", 1);
        aToken.attrPush(["href", image.attrGet("src")!]);
        token.children.unshift(aToken);
        token.children.push(new state.Token("link_close", "a", -1));
      }

      // for linked images, image is one off
      image
        = token.children.length === 1 ? token.children[0] : token.children[1];

      if (normalizedOptions.figcaption) {
        // store string value of option for later comparison
        const captionOptionString = new String(normalizedOptions.figcaption)
          .toLowerCase()
          .trim();

        if (captionOptionString === "title") {
          let figCaption: TokenAttr[1] | undefined;
          const captionObj = (image.attrs ?? []).find(([k]) => k === "title");

          if (captionObj) {
            figCaption = captionObj[1];
          }

          if (figCaption) {
            const captionArray = await md.parseInline(figCaption);

            // use empty default
            let captionContent: Pick<Token, "children"> = { children: [] };

            // override if the data is there
            if (captionArray.length > 0) {
              captionContent = captionArray[0];
            }

            // add figcaption
            token.children.push(
              new state.Token("figcaption_open", "figcaption", 1),
            );
            token.children.push(...captionContent.children);
            token.children.push(
              new state.Token("figcaption_close", "figcaption", -1),
            );

            if (image.attrs) {
              image.attrs = image.attrs.filter(function ([k]) {
                return k !== "title";
              });
            }
          }
        }
        else if (
          normalizedOptions.figcaption === true
          || captionOptionString === "alt"
        ) {
          if (image.children && image.children.length) {
            token.children.push(
              new state.Token("figcaption_open", "figcaption", 1),
            );
            token.children.splice(token.children.length, 0, ...image.children);
            token.children.push(
              new state.Token("figcaption_close", "figcaption", -1),
            );
            if (!normalizedOptions.keepAlt) {
              image.children.length = 0;
            }
          }
        }
      }

      if (normalizedOptions.copyAttrs && image.attrs) {
        const f
          = normalizedOptions.copyAttrs === true
            ? ""
            : normalizedOptions.copyAttrs;
        figure.attrs = image.attrs.filter(([k]) => k.match(f));
      }

      if (normalizedOptions.tabindex == true) {
        // add a tabindex property
        // you could use this with css-tricks.com/expanding-images-html5
        state.tokens[i - 1].attrPush(["tabindex", tabIndex + ""]);
        tabIndex++;
      }

      if (normalizedOptions.lazyLoading == true) {
        image.attrPush(["loading", "lazy"]);
      }
    }
  };
  md.core.ruler.before("linkify", "implicit_figures", implicitFigures);
};
