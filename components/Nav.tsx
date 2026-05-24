"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Nav() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-40">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-semibold text-lg text-green-800">Karjat Farms</span>
        </Link>

        <button
          className="md:hidden text-stone-700"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/farmhouses" className="text-stone-700 hover:text-green-700">
            Browse
          </Link>
          {status === "authenticated" && (
            <Link href="/bookings" className="text-stone-700 hover:text-green-700">
              My Bookings
            </Link>
          )}
          {session?.user?.role === "OWNER" && (
            <Link href="/admin" className="text-stone-700 hover:text-green-700">
              Owner Dashboard
            </Link>
          )}
          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              <span className="text-stone-600 text-xs">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-outline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-outline">
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-3 text-sm">
          <Link href="/farmhouses" className="block text-stone-700">Browse</Link>
          {status === "authenticated" && (
            <Link href="/bookings" className="block text-stone-700">My Bookings</Link>
          )}
          {session?.user?.role === "OWNER" && (
            <Link href="/admin" className="block text-stone-700">Owner Dashboard</Link>
          )}
          {status === "authenticated" ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="btn-outline w-full"
            >
              Sign out ({session.user?.name})
            </button>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="btn-outline flex-1">Login</Link>
              <Link href="/signup" className="btn-primary flex-1">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
