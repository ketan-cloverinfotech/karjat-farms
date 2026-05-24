import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding...");

  const ownerPassword = await bcrypt.hash("owner123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@karjatfarms.in" },
    update: {},
    create: {
      name: "Ravi Patil",
      email: "owner@karjatfarms.in",
      password: ownerPassword,
      phone: "+919876543210",
      role: "OWNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "user@example.com",
      password: userPassword,
      phone: "+919999900000",
      role: "USER",
    },
  });

  const farmhouses = [
    {
      slug: "green-valley-retreat",
      title: "Green Valley Retreat",
      description:
        "Nestled beside the Ulhas river, this lush 2-acre estate features a private pool, large lawn for cricket and bonfires, and a fully-equipped open kitchen. Wake up to misty mountain views and the sound of birdsong.",
      location: "Kondhane, Karjat",
      pricePerNight: 12500,
      maxGuests: 12,
      bedrooms: 4,
      bathrooms: 4,
      amenities: [
        "Private Pool",
        "Wi-Fi",
        "AC Bedrooms",
        "Barbecue",
        "Bonfire",
        "Parking",
        "Caretaker",
      ],
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      ],
    },
    {
      slug: "riverside-villa-karjat",
      title: "Riverside Villa Karjat",
      description:
        "Premium 5-BHK villa on the banks of Pej river. Infinity pool overlooking the water, indoor games room, large gazebo, and a chef on request. Perfect for family get-togethers and small corporate offsites.",
      location: "Pej, Karjat",
      pricePerNight: 18000,
      maxGuests: 16,
      bedrooms: 5,
      bathrooms: 5,
      amenities: [
        "Infinity Pool",
        "River Access",
        "Wi-Fi",
        "AC Bedrooms",
        "Indoor Games",
        "Gazebo",
        "Chef on Request",
        "Parking",
      ],
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
      ],
    },
    {
      slug: "mango-grove-bungalow",
      title: "Mango Grove Bungalow",
      description:
        "Charming 3-BHK colonial-style bungalow surrounded by a 50-tree mango orchard. Heated pool, large veranda, hammocks, and a swing for the kids. Pet-friendly!",
      location: "Khopoli Road, Karjat",
      pricePerNight: 8500,
      maxGuests: 8,
      bedrooms: 3,
      bathrooms: 3,
      amenities: [
        "Heated Pool",
        "Pet Friendly",
        "Wi-Fi",
        "AC Bedrooms",
        "Veranda",
        "Orchard",
        "Parking",
      ],
      images: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200",
      ],
    },
    {
      slug: "hilltop-haven",
      title: "Hilltop Haven",
      description:
        "Modern minimalist 2-BHK perched on a hill, with floor-to-ceiling glass walls and unmatched sunset views. Plunge pool, telescope for stargazing, and a curated library.",
      location: "Bhivpuri, Karjat",
      pricePerNight: 6500,
      maxGuests: 6,
      bedrooms: 2,
      bathrooms: 2,
      amenities: [
        "Plunge Pool",
        "Wi-Fi",
        "AC Bedrooms",
        "Telescope",
        "Library",
        "Parking",
      ],
      images: [
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200",
      ],
    },
    {
      slug: "waterfall-cottage",
      title: "Waterfall Cottage",
      description:
        "Cosy 2-BHK cottage 10 minutes walk from a seasonal waterfall. Outdoor jacuzzi, organic kitchen garden, and rustic charm. Ideal for couples and small families.",
      location: "Kashele, Karjat",
      pricePerNight: 5500,
      maxGuests: 5,
      bedrooms: 2,
      bathrooms: 2,
      amenities: [
        "Outdoor Jacuzzi",
        "Wi-Fi",
        "Kitchen Garden",
        "Bonfire",
        "Parking",
      ],
      images: [
        "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200",
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200",
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200",
      ],
    },
    {
      slug: "the-jungle-house",
      title: "The Jungle House",
      description:
        "Surrounded by dense Sahyadri forest, this 4-BHK villa offers true off-grid luxury. Solar power, infinity pool with valley view, and guided trekking trails right at the doorstep.",
      location: "Matheran Road, Karjat",
      pricePerNight: 15500,
      maxGuests: 14,
      bedrooms: 4,
      bathrooms: 4,
      amenities: [
        "Infinity Pool",
        "Wi-Fi",
        "AC Bedrooms",
        "Trekking Trails",
        "Solar Power",
        "Caretaker",
        "Parking",
      ],
      images: [
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200",
        "https://images.unsplash.com/photo-1600573472556-e636c2acda88?w=1200",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
      ],
    },
    {
      slug: "lakeview-lodge",
      title: "Lakeview Lodge",
      description:
        "Spacious 3-BHK lodge overlooking the serene Morbe lake. Kayaks and fishing gear provided, large barbecue deck, and a private jetty for sunrise coffee.",
      location: "Morbe, Karjat",
      pricePerNight: 9500,
      maxGuests: 10,
      bedrooms: 3,
      bathrooms: 3,
      amenities: [
        "Lake View",
        "Kayaks",
        "Fishing Gear",
        "Barbecue Deck",
        "Wi-Fi",
        "AC Bedrooms",
        "Parking",
      ],
      images: [
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
        "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1200",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200",
      ],
    },
  ];

  for (const f of farmhouses) {
    const created = await prisma.farmhouse.upsert({
      where: { slug: f.slug },
      update: {},
      create: {
        ...f,
        amenities: JSON.stringify(f.amenities),
        images: JSON.stringify(f.images),
        ownerId: owner.id,
      },
    });

    // Auto-create rooms if the farmhouse has none yet.
    const existingRooms = await prisma.room.count({ where: { farmhouseId: created.id } });
    if (existingRooms === 0) {
      const roomCount = Math.max(1, f.bedrooms);
      const perRoomCapacity = Math.max(1, Math.ceil(f.maxGuests / roomCount));
      const perRoomPrice = Math.max(500, Math.floor(f.pricePerNight / roomCount));
      for (let i = 0; i < roomCount; i++) {
        await prisma.room.create({
          data: {
            farmhouseId: created.id,
            name: `Room ${i + 1}`,
            capacity: perRoomCapacity,
            pricePerNight: perRoomPrice,
            displayOrder: i,
          },
        });
      }
    }
  }

  console.log(`Seeded ${farmhouses.length} farmhouses (with rooms).`);
  console.log("Login as owner: owner@karjatfarms.in / owner123");
  console.log("Login as user:  user@example.com / user123");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
