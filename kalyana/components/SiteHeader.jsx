import Link from "next/link";
import getDb from "@/lib/db";
import { getAllSettings } from "@/lib/settings";
import SearchBox from "./SearchBox";
import CartLink from "./CartLink";

export default function SiteHeader() {
  const db = getDb();
  const settings = getAllSettings();
  const categories = db
    .prepare(
      "SELECT id, name, slug FROM categories WHERE status = 'published' AND parent_id IS NULL ORDER BY sort_order ASC LIMIT 8"
    )
    .all();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-900/95 via-teal-900/95 to-emerald-900/95 backdrop-blur border-b border-emerald-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <img src="/logo.png" alt="Kalyana" className="h-16 w-16 object-cover rounded-lg shadow-lg group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              {settings.business_name || "Kalyana"}
            </span>
          </Link>

          <div className="hidden md:block flex-1 max-w-xl">
            <SearchBox />
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/products" className="hidden sm:inline text-cyan-100 hover:text-yellow-300 font-medium transition-colors">
              All Products
            </Link>
            <Link href="/suppliers" className="hidden sm:inline text-cyan-100 hover:text-emerald-300 font-medium transition-colors">
              Suppliers
            </Link>
            <Link href="/contact" className="hidden sm:inline text-cyan-100 hover:text-cyan-300 font-medium transition-colors">
              Contact
            </Link>
            <CartLink />
          </nav>
        </div>
        <div className="md:hidden pb-3">
          <SearchBox />
        </div>
        <div className="hidden md:flex gap-8 h-11 items-center text-sm border-t border-emerald-700/50 overflow-x-auto bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 backdrop-blur">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="text-cyan-200 hover:text-yellow-300 whitespace-nowrap transition-colors font-medium"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
