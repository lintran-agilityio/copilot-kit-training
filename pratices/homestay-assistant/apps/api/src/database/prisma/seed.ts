import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Amenity, PrismaClient } from '../generated/prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rooms = [
  {
    id: 'meridian',
    name: 'The Meridian',
    level: 4,
    levelColor: '#E6C547',
    capacity: 12,
    description:
      'A bright corner suite with floor-to-ceiling windows and flexible seating for workshops.',
    imageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    availableSlots: 14,
    pricePerNight: 1_200_000,
    amenities: [
      Amenity.monitor,
      Amenity.coffee,
      Amenity.wifi,
      Amenity.whiteboard,
    ],
  },
  {
    id: 'studio-north',
    name: 'Studio North',
    level: 2,
    levelColor: '#7DD3FC',
    capacity: 6,
    description:
      'Compact creative studio with acoustic treatment, ideal for recordings and focused sessions.',
    imageUrl:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
    availableSlots: 8,
    pricePerNight: 900_000,
    amenities: [Amenity.mic, Amenity.video, Amenity.wifi, Amenity.coffee],
  },
  {
    id: 'the-loft',
    name: 'The Loft',
    level: 5,
    levelColor: '#F472B6',
    capacity: 8,
    description:
      'Open loft with lounge seating and a relaxed atmosphere for team syncs and client calls.',
    imageUrl:
      'https://images.unsplash.com/photo-1497215842964-222b430d1738?auto=format&fit=crop&w=800&q=80',
    availableSlots: 5,
    pricePerNight: 1_100_000,
    amenities: [Amenity.monitor, Amenity.coffee, Amenity.wifi, Amenity.phone],
  },
  {
    id: 'observatory',
    name: 'The Observatory',
    level: 6,
    levelColor: '#A78BFA',
    capacity: 16,
    description:
      'Premium boardroom with panoramic views, dual displays, and executive conferencing setup.',
    imageUrl:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
    availableSlots: 3,
    pricePerNight: 1_800_000,
    amenities: [
      Amenity.monitor,
      Amenity.video,
      Amenity.wifi,
      Amenity.whiteboard,
      Amenity.phone,
    ],
  },
] ;

async function main(): Promise<void> {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: { ...room },
      create: { ...room },
    });
  }

  console.log(`Seeded ${rooms.length} rooms.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
