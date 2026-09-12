import { notFound } from "next/navigation";
import getDb from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PaymentSuccessClient from "@/components/PaymentSuccessClient";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({ params, searchParams }) {
  const { id } = await params;
  const db = getDb();

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) notFound();

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);

  // Get payment details from search params
  const payment = {
    gateway: searchParams.gateway || 'unknown',
    transactionId: searchParams.transactionId || `TXN-${Date.now()}`,
    status: searchParams.status || 'completed'
  };

  return (
    <>
      <SiteHeader />
      <PaymentSuccessClient order={order} items={items} payment={payment} />
      <SiteFooter />
    </>
  );
}
