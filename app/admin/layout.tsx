import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 border-b border-stone-200 pb-4 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Owner Dashboard</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-stone-700 hover:text-green-700">Overview</Link>
          <Link href="/admin/farmhouses" className="text-stone-700 hover:text-green-700">My Farmhouses</Link>
          <Link href="/admin/bookings" className="text-stone-700 hover:text-green-700">Bookings</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
