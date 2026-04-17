import { z } from "zod";

export const brainRingSchema = z.array(
  z.object({
    question: z.string(),
    answer: z.string()
  })
);
