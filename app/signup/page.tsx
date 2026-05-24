"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "USER" as "USER" | "OWNER",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create account.");
      setLoading(false);
      return;
    }
    const signin = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signin?.ok) {
      router.push(form.role === "OWNER" ? "/admin" : "/");
      router.refresh();
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Create your account</h1>
        <p className="text-sm text-stone-500 mb-6">Book farmhouses or list your own</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              autoComplete="new-password"
            />
            <p className="text-xs text-stone-500 mt-1">At least 6 characters</p>
          </div>
          <div>
            <label className="label">I want to…</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "USER" | "OWNER" })}
              className="input"
            >
              <option value="USER">Book farmhouses</option>
              <option value="OWNER">List my farmhouse</option>
            </select>
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-stone-600 mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-green-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
