import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const days = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/days" }),
  schema: z.object({
    day: z.number(),
    title: z.string(),
    // URL path the QR code points to. Defaults to /day-<n>.
    slug: z.string().optional(),
    audio: z
      .object({
        src: z.string(),
        duration: z.string().optional(),
        title: z.string().optional(),
      })
      .optional(),
    // Put the player right under the title (short "press play" pages).
    // Otherwise it goes where the text has <div data-audio></div>, or at the end.
    audioFirst: z.boolean().default(false),
    spotify: z.object({ title: z.string(), url: z.string() }).optional(),
    rating: z.boolean().default(true),
    // Content not received yet: the page shows a "coming soon" note.
    pending: z.boolean().default(false),
  }),
});

export const collections = { days };
