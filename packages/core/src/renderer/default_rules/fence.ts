import {
  escapeHtml,
  resolvePromiseLike,
  unescapeAll,
} from "../../common/utils";
import type { TokenAttr } from "../../token";
import type { RendererFn } from "../renderer";

export const fence: RendererFn<"async"> = async (
  tokens,
  idx,
  options,
  _env,
  renderer,
) => {
  const token = tokens[idx];
  const info = token.info ? unescapeAll(token.info).trim() : "";
  let langName = "";
  let langAttrs = "";

  if (info) {
    const arr = info.split(/(\s+)/g);
    langName = arr[0];
    langAttrs = arr.slice(2).join("");
  }

  let highlighted = "";
  if (options.highlight) {
    highlighted =
      (await resolvePromiseLike(
        options.highlight(token.content, langName, langAttrs),
      )) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.startsWith("<pre")) {
    return highlighted + "\n";
  }

  // If language exists, inject class gently, without modifying original token.
  // May be, one day we will add .deepClone() for token and simplify this part, but
  // now we prefer to keep things local.
  if (info) {
    const i = token.attrIndex("class");
    const tmpAttrs = token.attrs ? token.attrs.slice() : [];

    if (i < 0) {
      tmpAttrs.push(["class", options.langPrefix + langName]);
    } else {
      tmpAttrs[i] = tmpAttrs[i].slice() as TokenAttr;
      tmpAttrs[i][1] += " " + options.langPrefix + langName;
    }

    // Fake token just to render attributes
    const tmpToken = {
      attrs: tmpAttrs,
    };

    return `<pre><code${renderer.renderAttrs(tmpToken)}>${highlighted}</code></pre>\n`;
  }

  return `<pre><code${renderer.renderAttrs(token)}>${highlighted}</code></pre>\n`;
};
