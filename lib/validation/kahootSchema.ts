import { z } from "zod";

export const kahootSchema = z.array(
  z.object({
    topic: z.string(),
    questions: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        correct_option: z.string()
      })
    )
  })
);
