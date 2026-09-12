"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full gap-0">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Search products, categories, suppliers..."
        className="w-full rounded-l-xl border-2 border-cyan-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white text-slate-900 placeholder-slate-500"
      />
      <button
        type="submit"
        className="rounded-r-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
      >
        Search
      </button>
    </form>
  );
}
