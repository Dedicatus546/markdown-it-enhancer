import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Markdown-It-Enhancer",
  description: "Modern pluggable markdown parser and support async.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Playground", link: "/" }],

    sidebar: [
      {
        text: "What is Markdown-It-Enhancer",
        link: "/guide/what-is-markdown-it-enhancer",
      },
      { text: "Getting Started", link: "/guide/getting-started" },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/Dedicatus546/markdown-it-enhancer",
      },
    ],
  },
});
