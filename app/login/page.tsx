"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Welcome back</h1>
        <p className="text-sm text-stone-500 mb-6">Sign in to manage your bookings</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-sm text-stone-600 mt-4 text-center">
          New here?{" "}
          <Link href="/signup" className="text-green-700 font-medium hover:underline">
            Create an account
          </Link>
        </p>
        <div className="mt-6 text-xs text-stone-500 border-t pt-4">
          <p className="font-medium text-stone-600 mb-1">Demo accounts:</p>
          <p>User: user@example.com / user123</p>
          <p>Owner: owner@karjatfarms.in / owner123</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center text-stone-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
