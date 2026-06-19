import type { Room } from "@/types/room";

export const ROOMS: Room[] = [
  {
    id: "meridian",
    name: "The Meridian",
    level: 4,
    levelColor: "#E6C547",
    capacity: 12,
    description:
      "A bright corner suite with floor-to-ceiling windows and flexible seating for workshops.",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    availableSlots: 14,
    amenities: ["monitor", "coffee", "wifi", "whiteboard"],
  },
  {
    id: "studio-north",
    name: "Studio North",
    level: 2,
    levelColor: "#7DD3FC",
    capacity: 6,
    description:
      "Compact creative studio with acoustic treatment, ideal for recordings and focused sessions.",
    imageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    availableSlots: 8,
    amenities: ["mic", "video", "wifi", "coffee"],
  },
  {
    id: "the-loft",
    name: "The Loft",
    level: 5,
    levelColor: "#F472B6",
    capacity: 8,
    description:
      "Open loft with lounge seating and a relaxed atmosphere for team syncs and client calls.",
    imageUrl:
      "https://images.unsplash.com/photo-1497215842964-222b430d1738?auto=format&fit=crop&w=800&q=80",
    availableSlots: 5,
    amenities: ["monitor", "coffee", "wifi", "phone"],
  },
  {
    id: "observatory",
    name: "The Observatory",
    level: 6,
    levelColor: "#A78BFA",
    capacity: 16,
    description:
      "Premium boardroom with panoramic views, dual displays, and executive conferencing setup.",
    imageUrl:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
    availableSlots: 3,
    amenities: ["monitor", "video", "wifi", "whiteboard", "phone"],
  },
];

export function getRoomById(id: string): Room | undefined {
  return ROOMS.find((room) => room.id === id);
}

export function getRoomsByIds(ids: string[]): Room[] {
  return ids
    .map((id) => getRoomById(id))
    .filter((room): room is Room => room !== undefined);
}
