import Image from "next/image";

const TESTIMONIALS = [
  {
    name: "Pooja patil",
    location: "Mumbai · Group of 12",
    quote:
      "Booked the riverside villa for a birthday weekend. The pool, the bonfire and the food — everything was on point. The host even arranged a cake! Will book again.",
    photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400",
    rating: 5,
  },
  {
    name: "Ketan Thombare",
    location: "Pune · Family of 8",
    quote:
      "Our kids spent two whole days in the pool. The mango orchard, hammocks, and bonfire made it feel like a proper Konkan vacation. Super clean and well-managed.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    rating: 5,
  },
  {
    name: "Jayesh&Komal",
    location: "Mumbai · Couple",
    quote:
      "A quiet 2BR hilltop place for our anniversary. Stargazing telescope was a sweet surprise. Booking was simple, payment was fast. 10/10.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    rating: 5,
  },
  {
    name: "Office offsite — Clover Infotech",
    location: "Mumbai · Team of 16",
    quote:
      "We hosted our annual offsite at the Jungle House. Conference setup in the gazebo, treks in the morning, BBQ at night. Worth every rupee.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    rating: 5,
  },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
  "https://images.unsplash.com/photo-1502209524164-acea936639a2?w=800",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
  "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800",
];

export function HappyCustomers() {
  return (
    <section className="bg-stone-50 border-t border-stone-200 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Our Happy Customers</h2>
          <p className="text-stone-500 mt-2">
            ★★★★★ 4.9 average from 800+ weekend stays
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-stone-200 shrink-0">
                  <Image src={t.photo} alt={t.name} fill className="object-cover" sizes="48px" unoptimized />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 text-sm truncate">{t.name}</p>
                  <p className="text-xs text-stone-500 truncate">{t.location}</p>
                </div>
              </div>
              <div className="text-amber-500 text-sm mb-2">{"★".repeat(t.rating)}</div>
              <p className="text-sm text-stone-700 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xl font-semibold text-stone-900 mb-4 text-center">
            Moments from our properties
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {GALLERY.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-stone-100">
                <Image
                  src={src}
                  alt={`Gallery photo ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
