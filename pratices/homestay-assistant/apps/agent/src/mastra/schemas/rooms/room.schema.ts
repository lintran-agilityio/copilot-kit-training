import { z } from "zod";

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  levelColor: z.string(),
  capacity: z.number(),
  description: z.string(),
  imageUrl: z.string(),
  availableSlots: z.number(),
  amenities: z.array(z.string()),
  pricePerNight: z.number(),
});

export type Room = z.infer<typeof roomSchema>;
