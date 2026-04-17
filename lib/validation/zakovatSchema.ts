import { z } from "zod";

export const zakovatSchema = z.array(
  z.object({
    question: z.string(),
    answer: z.string(),
    explanation: z.string()
  })
);
