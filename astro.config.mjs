import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://shiorangerin.github.io",
  outDir: "./docs",
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (path === "/") {
          return { ...item, priority: 1.0, changefreq: "weekly" };
        }
        if (path.startsWith("/blog/") || path.startsWith("/stories/")) {
          return { ...item, priority: 0.7, changefreq: "monthly" };
        }
        return { ...item, priority: 0.5, changefreq: "monthly" };
      },
    }),
  ],
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: {
      theme: "github-dark-dimmed",
      wrap: true,
    },
  },
});
