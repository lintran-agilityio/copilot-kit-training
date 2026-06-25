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
  pricePerNight: z.number(),
  amenities: z.array(z.string()),
});

export type Room = z.infer<typeof roomSchema>;
