import { notFound } from "next/navigation";
import Link from "next/link";
import getDb from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OrderConfirmationClient from "@/components/OrderConfirmationClient";

export const dynamic = "force-dynamic";

function formatPKR(amount) {
  return `₨ ${parseFloat(amount).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

function getStatusColor(status) {
  switch(status) {
    case 'confirmed': return 'from-emerald-400 to-cyan-400';
    case 'pending': return 'from-yellow-400 to-orange-400';
    case 'completed': return 'from-emerald-500 to-green-500';
    default: return 'from-slate-400 to-slate-500';
  }
}

export default async function OrderConfirmationPage({ params }) {
  const { id } = await params;
  const db = getDb();

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) notFound();

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);

  return (
    <>
      <SiteHeader />
      <OrderConfirmationClient order={order} items={items} />
      <SiteFooter />
    </>
  );
}
