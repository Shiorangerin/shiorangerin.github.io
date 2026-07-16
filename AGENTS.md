# Shiorangerin.github.io

基于 Astro 构建的个人站点。

## 命令

```bash
npm run dev      # 开发服务器
npm run build    # 构建（含 astro check 类型检查）
npm run preview  # 预览构建产物
```

输出目录：`docs/`，部署到 GitHub Pages。

## 结构

```
src/
├── components/   # BlogCard, GlassPanel, SearchBar, Sidebar
├── content/      # blog/ 和 stories/ 两个内容集合
├── layouts/      # BaseLayout（导航、SEO、主题切换）
├── pages/        # 路由页面
│   ├── blog/     # 默想
│   ├── stories/  # 故事（OC 集）
│   ├── about.astro    # 读经
│   ├── links.astro    # 其他链接
│   └── rss.xml.js     # RSS
└── styles/       # global.css
```

## 约定

- 内容文件使用 Markdown，frontmatter 包含 title/description/date/tags/draft/pinned
- 圣经原文使用 `<span class="bible-verse" data-ref="书名 章:节">` 包裹，悬停显示出处
- 输出到 `docs/`（GitHub Pages 部署目标）
