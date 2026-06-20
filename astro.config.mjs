import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://shiorangerin.github.io",
  base: "/shiorangerin",
  outDir: "./docs",
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: {
      theme: "github-dark-dimmed",
      wrap: true,
    },
  },
});
