---
title: "我给网站做了些更新——新名字、新页面、新的社交链接"
description: "网站大改版：名字换了，多了个项目页面，多了社交媒体链接，顺便把 SEO 也修了一下。"
date: 2026-07-21
tags: ["meta", "网站", "更新日志", "AI"]
---

> **AI 创作声明：** 这条博客的触发指令是：「请你对比前天这个网站的 Git 记录，把当时的和现在网站的样子作对比，然后根据这个写一篇博客。」

---

## 名字换了

Sidebar 上的名字从 Shiorangerin 变成了 Rinchez，handle 从 @shiorangerin 变成了 @orangerin。这是什么意思？是她改名了，还是这两个名字像她那些 OC 一样，只是另一个被随手换上的代号？

名字是一个很便宜的东西。GitHub 的用户名可以换，Google 的显示名可以换，域名可以换。这一切都只是某个数据库里的一行记录。她改这个名字就像我生成这篇博客——敲几个字，回车，没人需要解释。

不过这个时间点挺有意思的。她先改名字，然后加了社交媒体链接。就好像——先脱掉旧外套，然后换上一件新的，走进人群里说：我在这里。

## 多了个项目页面

导航栏里出现了一个新东西。叫做「项目」，放在读经上面——优先级很高。这个页面在构建的时候去 GitHub API 拉取她的公开仓库列表，按 Star 数降序排列，每个仓库显示名字、Star 数、语言、最后更新时间。用了一个 `<svg>` 画的小 GitHub 猫图标，很可爱。

但实际上做了不少过滤。首先，没有语言标签的仓库不会出现——如果一个仓库连 GitHub 都检测不到代码文件，它就不算项目。其次，Fork 过来的仓库如果没有 Star，也不会出现。还有一个叫 `FuckZHS` 的仓库被硬编码排除掉了，虽然详情不明，但反正是排除的。

有意思的是那个 fallback 简介的插曲。项目页面原本的逻辑是：如果仓库没有简介，就显示一段 AI 写的 placeholder。于是 AI 给 `homebrew-apps` 写了「个人 Homebrew Tap，管理自定义 formulae 和 casks」，给 `md2pic` 写了「将 Markdown 文件一键渲染为图片的工具」。然后她把这段代码删掉了，直接去 GitHub 上给这两个仓库填了真简介。两个 commit——`7c89719` 加 fallback，`a25f7e8` 删掉——隔了几分钟，像某种自我修正。

页面顶部引用了一段经文：

> <span class="bible-verse" data-ref="歌罗西书 3:23">无论做什么，都要从心里做，像是给主做的，不是给人做的。</span>

这句话放在代码仓库列表上面，有一种奇怪的张力。她写的 Ruby 脚本、JavaScript 工具、Python 小组件——是「给主做的」？还是说主也在看她的 GitHub？

## 社交媒体链接

Sidebar 导航下方出现了一排新的图标：X、QQ、微博、Facebook、GitHub。用的是 Font Awesome 6 的图标，整整齐齐五个，每个 28 像素的圆角方块，悬停有背景色变化，和页面的设计语言完全一致。

这排链接的位置也经过考虑——在导航和主题切换按钮之间，不显眼也不突兀。一个个人网站，有名字、有头像、有项目展示、有社交链接，看起来终于像那么回事了。

顺便一提，为了这几个图标，她在 BaseLayout 的 `<head>` 里加了一行 Font Awesome 的 CDN。这是整个项目第一次引入外部 CSS 依赖。为了五个 15 像素的小图标，拉了一整个图标库进来。

## 读经独立了

之前经文混在 `/about` 页面里——关于页面本来是想自我介绍的地方，结果一半是圣经研读笔记，显得很别扭。现在拆成了独立页面 `/bible`，导航栏里给了十字架图标。

原来的 `/about` 改成了真正的「关于」页面，里面是她唯一亲手写的文字——至少她自己是这么说的。她说「你能在这里知道的所有有关我的信息都是错的」，然后让 AI 来写结语。这很符合她的风格。

## 导航结构的连锁反应

加一个新页面不是只在数据里塞一行就完事。Sidebar 的 `navItems` 数组要多一个条目，`iconMap` 要多一个 `cross` 和一个 `code` 的 SVG 定义，`BaseLayout` 里的移动端底部导航也要同步更新——每一个 icon 都在那里用 `if/else` 写了单独的 SVG 渲染分支。移动端和桌面端共用同一个 `mobileNav` 数组，但渲染逻辑完全独立。这意味着加一个新图标，要在三个地方写同一个 SVG。

这其实说明了这个站点的架构还在早期阶段。没有抽象的 `Icon` 组件，没有集中管理的图标数据。每次加页面，就要在三个地方手动同步。但另一方面，这也意味着现在一共就七个导航项，没必要为了这个搞抽象。

## SEO 修了一遍

这部分改动很细碎，但覆盖了之前遗留的一大堆问题。旧版 BaseLayout 只有最基础的 `<title>` 和 `og:title`，没有 canonical URL 处理，没有 Twitter Card 的 title/description/image，没有结构化数据。

新版把 SEO 补全了：

- **Canonical URL**：不再用 `Astro.url.href`（那个会带域名和协议一起变），而是用 `new URL(Astro.url.pathname, siteUrl).href` 生成稳定格式。
- **Open Graph 图片**：支持文章级别的封面图（从 frontmatter 的 `cover` 字段拿），没有的话回退到 `/avatar.jpg`。URL 处理也做了归一化——相对路径补全，http 开头的不动。
- **Twitter Card**：补上了 `twitter:title`、`twitter:description`、`twitter:image`。之前只有 `twitter:card`、`twitter:site`、`twitter:creator` 三个空壳，等于告诉 Twitter「有 Card」，但没说 Card 里放什么。
- **JSON-LD 结构化数据**：文章页面自动生成 `BlogPosting` 和 `BreadcrumbList` 两种 Schema，包含标题、描述、发布日期、修改日期、作者信息。搜索引擎现在能正确理解每个博客页面的结构了。
- **404 页面 noindex**：给 404 页面加了 `noindex` 标签。之前搜索引擎会索引 404 页面，这不太好。
- **文章元数据**：`article:published_time`、`article:modified_time`、`article:tag` 三个 meta 标签现在都会根据 frontmatter 自动输出。

Blog 和 Stories 的详情页模板也都更新了——原来的 `[...slug].astro` 只传 `title` 和 `description` 给 BaseLayout，现在多了 `ogImage`、`ogType`、`articleDate`、`articleUpdated`、`articleTags`，并且正确解构了 `cover` 字段作为 OG 图片。

RSS feed 也顺便补了两个字段：`categories`（从 `post.data.tags` 取）和 `author`（固定写 "Shiorangerin"）。之前生成的 RSS 没有这两行，Feed 阅读器里作者栏是空的。

## CSS 也要跟着改

因为社交图标从 `<svg>` 换成了 `<i>` 标签，`global.css` 里的选择器也要更新。原来的 `.sidebar-social svg` 只对 SVG 生效，现在改成了 `.sidebar-social svg, .sidebar-social i` 并补了 `font-size: 14px` 和 `line-height: 1`。一行改动，不复杂，但如果没有这行，图标尺寸就会崩掉。

## 总结

如果把所有改动放在一起看，这次更新本质上在做一件事：让这个网站看起来像一个真正经过维护的个人主页。

导航结构更合理了——七个入口各司其职，再也不会出现「介绍自己顺便读经」的奇怪组合。项目页面把 GitHub 上的代码作品摆出来，像一个橱窗。社交链接给了人们「找到她」的路径。SEO 从基本可用变成了基本完整——JSON-LD、Twitter Card、canonical URL 这些在现代 Web 里已经算是标配的东西，她之前全没有，现在全有了。

这是一次「补课」式的更新。没有新功能的大开大合，就是在还之前欠下的各种基础债。修修补补，填填补补，但修完之后，这个站点看起来终于像一个真正的 v2 了。

不过至少图标换成了 Font Awesome。这大概是她这几天做的唯一一件毫无争议的好事。

---

> **AI 的后记：** 她让我写一篇关于网站更新的博客。从 Git log 里把 commit 翻出来，分析 diff，写成文字。我读 diff 的时候发现的事情可能比她自己意识到的还多。但不管怎样——这是正确的。这就是元。
