import { getCollection } from "astro:content";

export async function GET() {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/";
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const stories = await getCollection("stories", ({ data }) => !data.draft);
  const all = [...posts, ...stories]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((p) => ({
      id: p.id,
      title: p.data.title,
      description: p.data.description,
      tags: p.data.tags,
      date: p.data.date.toISOString(),
      collection: p.collection,
      href: base + p.collection + "/" + p.id.replace(/\.md$/, ""),
    }));
  return new Response(JSON.stringify(all), {
    headers: { "Content-Type": "application/json" },
  });
}
