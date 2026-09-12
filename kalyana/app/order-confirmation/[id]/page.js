import { notFound } from "next/navigation";
import Link from "next/link";
import getDb from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params }) {
  const { id } = await params;
  const db = getDb();

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) notFound();

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold mb-1">Order Placed Successfully</h1>
          <p className="text-neutral-500">
            Order <span className="font-mono">{order.order_number}</span>
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white mb-6">
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-medium">${item.line_total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>${order.shipping_fee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span>${order.tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="text-sm text-neutral-500 mb-8">
          Status: <span className="font-medium text-neutral-800 capitalize">{order.order_status}</span> ·
          Payment: <span className="font-medium text-neutral-800 capitalize">{order.payment_status}</span>
        </div>

        <div className="text-center">
          <Link href="/products" className="text-amber-800 font-medium hover:underline">
            Continue Shopping →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
