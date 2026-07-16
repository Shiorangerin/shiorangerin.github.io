import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const blogPosts = await getCollection("blog", ({ data }) => !data.draft);
  blogPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const storyPosts = await getCollection("stories", ({ data }) => !data.draft);
  storyPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const items = [...blogPosts, ...storyPosts]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${post.collection}/${post.id.replace(/\.md$/, "")}`,
    }));

  return rss({
    title: "Shiorangerin 默想",
    description: "信仰、技术与生活的默想记录。",
    site: context.site,
    items,
    customData: "<language>zh-CN</language>",
  });
}
