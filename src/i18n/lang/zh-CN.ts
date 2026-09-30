import type { UIStrings } from "../types";

export default {
  nav: {
    home: "首页",
    posts: "博客",
    tags: "标签",
    about: "关于",
    archives: "归档",
    search: "搜索",
  },
  post: {
    publishedAt: "发布于",
    updatedAt: "更新于",
    sharePostIntro: "分享文章",
    sharePostOn: "分享到 {{platform}}",
    sharePostViaEmail: "通过邮件分享",
    tagLabel: "标签",
    backToTop: "返回顶部",
    goBack: "返回",
    editPage: "编辑页面",
    previousPost: "上一篇",
    nextPost: "下一篇",
  },
  pagination: {
    prev: "上一页",
    next: "下一页",
    page: "页",
  },
  home: {
    socialLinks: "相关链接",
    featured: "精选文章",
    recentPosts: "近期文章",
    allPosts: "全部文章",
  },
  footer: {
    copyright: "版权所有",
    allRightsReserved: "尊重开源与原始来源",
  },
  pages: {
    tagTitle: "标签",
    tagDesc: "该标签下的文章",

    tagsTitle: "标签",
    tagsDesc: "按主题浏览全部文章标签。",

    postsTitle: "博客",
    postsDesc: "Clash 下载、手机版、电脑版与配置教程博客。",

    archivesTitle: "归档",
    archivesDesc: "按日期查找教程与更新文章。",

    searchTitle: "搜索",
    searchDesc: "搜索客户端名称、配置方法或故障现象。",
  },
  a11y: {
    skipToContent: "跳至正文",
    openMenu: "展开菜单",
    closeMenu: "收起菜单",
    toggleTheme: "切换主题",
    searchPlaceholder: "搜索文章…",
    noResults: "没有找到相关内容",
    goToPreviousPage: "前往上一页",
    goToNextPage: "前往下一页",
  },
  notFound: {
    title: "404 页面未找到",
    message: "页面未找到",
    goHome: "返回首页",
  },
} satisfies UIStrings;
