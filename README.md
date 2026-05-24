# Karjat Farms

A farmhouse booking application for Karjat — browse, search, and book farmhouses with date-based availability, secure auth, Razorpay payments, and an owner admin panel.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Prisma + SQLite**, **NextAuth v5**, and **Razorpay**.

## Features

- 🏠 Browse and search 7 seeded Karjat farmhouses (filters: location, guests, price)
- 📅 Date-range picker with real-time availability checks (no double-bookings)
- 🔐 Email + password auth with roles (USER / OWNER)
- 💳 Razorpay checkout for booking payment (falls back to instant confirmation if keys aren't configured — handy for local dev)
- 👤 "My Bookings" page with cancel support
- 🛠 Owner dashboard: stats, manage listings (CRUD), view all bookings

## Quick start

```bash
# 1. Install
npm install

# 2. Apply DB migrations
npx prisma migrate dev

# 3. Seed demo data
npx tsx prisma/seed.ts

# 4. Run dev server
npm run dev
```

App will be available at [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role  | Email                    | Password   |
| ----- | ------------------------ | ---------- |
| User  | `user@example.com`       | `user123`  |
| Owner | `owner@karjatfarms.in`   | `owner123` |

## Environment

Copy `.env` and fill in real values:

```env
DATABASE_URL="file:./dev.db"

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET="..."
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"

# Razorpay test keys from https://dashboard.razorpay.com/
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```

> If Razorpay keys are left as placeholders, bookings still work — they're auto-confirmed without payment. Useful for local testing.

## Routes

| Path                                  | Purpose                                  |
| ------------------------------------- | ---------------------------------------- |
| `/`                                   | Landing page with featured properties    |
| `/farmhouses`                         | Listing with filters                     |
| `/farmhouses/[slug]`                  | Detail page + booking widget             |
| `/login`, `/signup`                   | Auth                                     |
| `/bookings`                           | User's bookings                          |
| `/admin`                              | Owner overview (stats, recent bookings)  |
| `/admin/farmhouses`                   | Owner's listings (with edit/delete)      |
| `/admin/farmhouses/new`               | Create a farmhouse                       |
| `/admin/farmhouses/[id]/edit`         | Edit a farmhouse                         |
| `/admin/bookings`                     | All bookings on owner's properties       |

## API routes

- `POST /api/auth/signup` — create account
- `POST /api/bookings` — create booking + Razorpay order
- `DELETE /api/bookings/[id]` — cancel a booking
- `POST /api/payment/verify` — verify Razorpay signature & confirm booking
- `POST /api/owner/farmhouses` — create farmhouse (owner only)
- `PATCH /api/owner/farmhouses/[id]` — update farmhouse
- `DELETE /api/owner/farmhouses/[id]` — delete farmhouse

## Tech stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind v4, `react-day-picker`
- **Backend:** Next.js Route Handlers, Prisma 7 with `@prisma/adapter-better-sqlite3`
- **Auth:** NextAuth v5 (Credentials provider, JWT sessions)
- **Payments:** Razorpay SDK + HMAC SHA-256 signature verification
- **Validation:** Zod

## Schema

- `User` — id, name, email, password (hashed), phone, role
- `Farmhouse` — title, slug, description, location, pricePerNight, maxGuests, bedrooms, bathrooms, amenities (JSON), images (JSON), ownerId
- `Booking` — userId, farmhouseId, checkIn, checkOut, guests, totalAmount, status (PENDING/CONFIRMED/CANCELLED), razorpayOrderId, razorpayPaymentId

## Scripts

```bash
npm run dev      # dev server with Turbopack
npm run build    # production build
npm run start    # production server
npx prisma studio  # browse the local DB
```
