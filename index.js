// ==UserScript==
// @name         隐藏知乎元素
// @namespace    http://tampermonkey.net/
// @version      2025-07-18
// @description  没有描述
// @author       Par9uet
// @match        https://www.zhihu.com/*
// @match        https://zhuanlan.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @grant        none
// ==/UserScript==

(function () {
  const id = "hide_by_tampermonkey";
  const style = document.createElement("style");
  style.id = id;
  style.innerText = `
    .WriteArea.Card {
      display: none !important;
    }

    .Topstory-mainColumn {
      width: 100% !important;
    }

    .Topstory-mainColumn + div {
      display: none !important;
    }

    .Tabs.AppHeader-Tabs {
      display: none !important;
    }

    .SearchBar-askContainer {
      display: none !important;
    }

    .AppHeader-userInfo > *:not(:last-child) {
      display: none !important;
    }

    .Question-mainColumn {
      width: 100%;
    }

    .Question-sideColumn {
      display: none !important;
    }

    .AuthorInfo {
      max-width: 100%;
    }

    .QuestionButtonGroup {
      display: none !important;
    }

    .PageHeader .QuestionHeader-main {
      width: 0;
      flex-grow: 1;
    }

    .ColumnPageHeader-Button {
      display: none !important;
    }

    .Post-Row-Content-left {
      width: 0;
      flex-grow: 1;
    }

    .Post-Row-Content-right {
      display: none !important;
    }
  `;
  document.body.append(style);
  console.log("已插入隐藏样式");
})();
