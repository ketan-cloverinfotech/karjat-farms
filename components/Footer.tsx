export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Karjat Farms. Curated weekend retreats.</p>
        <p>Made with 🌿 for the Sahyadris</p>
      </div>
    </footer>
  );
}
