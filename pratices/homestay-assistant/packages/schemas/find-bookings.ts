import { z } from "zod";

export const findBookingsInputSchema = z.object({
  roomName: z
    .string()
    .trim()
    .min(1, "roomName cannot be empty")
    .optional()
    .describe("Optional case-insensitive partial room-name match"),
});

export type FindBookingsInput = z.infer<typeof findBookingsInputSchema>;
