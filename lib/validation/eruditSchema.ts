import { z } from "zod";

const tierSchema = z.object({
  q: z.string(),
  a: z.string(),
  e: z.string()
});

export const eruditSchema = z.array(
  z.object({
    topic: z.string(),
    questions: z.object({
      "10": tierSchema,
      "20": tierSchema,
      "30": tierSchema,
      "40": tierSchema,
      "50": tierSchema
    })
  })
);
