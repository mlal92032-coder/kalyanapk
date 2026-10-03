"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/categories", label: "Categories", icon: "🗂️" },
  { href: "/suppliers", label: "Suppliers", icon: "🏭" },
  { href: "/orders", label: "Orders", icon: "🧾" },
  { href: "/banners", label: "Banners", icon: "🎨" },
  { href: "/settings", label: "Homepage & Settings", icon: "⚙️" },
];

export default function AdminSidebar({ adminName }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-blue-950 via-teal-950 to-emerald-950 text-slate-300 min-h-screen flex flex-col border-r border-emerald-700/50">
      <div className="px-5 py-6 border-b border-emerald-700/50 flex items-center gap-3 bg-gradient-to-r from-emerald-900/30 to-cyan-900/20">
        <img src="/logo.png" alt="Kalyana" className="h-14 w-14 object-cover rounded-lg shadow-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-lg bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">Kalyana</div>
          <div className="text-xs text-cyan-300 font-semibold">Owner C-Panel</div>
        </div>
      </div>
      <nav className="flex-1 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-all font-medium ${
                active
                  ? "bg-gradient-to-r from-emerald-700/40 to-cyan-700/40 text-white border-r-4 border-yellow-400 shadow-lg"
                  : "text-slate-300 hover:bg-emerald-900/30 hover:text-cyan-200"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-emerald-700/50 bg-gradient-to-r from-emerald-900/20 to-cyan-900/10">
        <div className="text-xs text-cyan-300 mb-3 font-semibold">{adminName}</div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-white font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all hover:scale-105"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
