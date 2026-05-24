// One-time migration script: create default rooms for farmhouses that have none,
// and backfill existing bookings to link to all rooms of their farmhouse.
//
// Safe to run multiple times — skips farmhouses that already have rooms,
// and skips bookings that already have room links.

import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const farmhouses = await prisma.farmhouse.findMany({
    include: { rooms: true, bookings: { include: { rooms: true } } },
  });

  let roomsCreated = 0;
  let bookingsBackfilled = 0;

  for (const f of farmhouses) {
    let roomIds = f.rooms.map((r) => r.id);

    if (f.rooms.length === 0) {
      const roomCount = Math.max(1, f.bedrooms);
      const perRoomCapacity = Math.max(1, Math.ceil(f.maxGuests / roomCount));
      const perRoomPrice = Math.max(500, Math.floor(f.pricePerNight / roomCount));

      const created = [];
      for (let i = 0; i < roomCount; i++) {
        const r = await prisma.room.create({
          data: {
            farmhouseId: f.id,
            name: `Room ${i + 1}`,
            capacity: perRoomCapacity,
            pricePerNight: perRoomPrice,
            displayOrder: i,
          },
        });
        created.push(r);
        roomsCreated += 1;
      }
      roomIds = created.map((r) => r.id);
      console.log(`  ${f.title}: created ${created.length} rooms`);
    }

    // Backfill old bookings: any booking with no room links → link to ALL rooms
    for (const b of f.bookings) {
      if (b.rooms.length === 0 && roomIds.length > 0) {
        await prisma.bookingRoom.createMany({
          data: roomIds.map((rid) => ({ bookingId: b.id, roomId: rid })),
        });
        bookingsBackfilled += 1;
      }
    }
  }

  console.log(`\nDone. Created ${roomsCreated} rooms across ${farmhouses.length} farmhouses.`);
  console.log(`Backfilled ${bookingsBackfilled} legacy bookings.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
