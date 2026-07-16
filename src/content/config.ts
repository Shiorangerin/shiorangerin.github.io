import { defineCollection, z } from "astro:content";

const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
  pinned: z.boolean().default(false),
});

const blog = defineCollection({ type: "content", schema: postSchema });
const stories = defineCollection({ type: "content", schema: postSchema });

export const collections = { blog, stories };
