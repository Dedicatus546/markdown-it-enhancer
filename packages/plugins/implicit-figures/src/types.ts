export interface ImplicitFiguresOptions {
  dataType?: boolean // <figure data-type="image">, default: false
  figcaption?: boolean | string // <figcaption>alternative text</figcaption>, default: false
  keepAlt?: boolean // <img alt="alt text" .../><figcaption>alt text</figcaption>, default: false
  lazyLoading?: boolean // <img loading="lazy" ...>, default: false
  link?: boolean // <a href="img.png"><img src="img.png"></a>, default: false
  tabindex?: boolean // <figure tabindex="1+n">..., default: false
  copyAttrs?: string | RegExp | boolean
}

export type ImplicitFiguresNormalizedOptions = Required<ImplicitFiguresOptions>;
