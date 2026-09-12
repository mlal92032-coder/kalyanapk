import { notFound } from "next/navigation";
import Link from "next/link";
import getDb from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Success Header */}
        <div className="text-center mb-12 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl border-2 border-emerald-300 p-8">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-2">Order Confirmed!</h1>
          <p className="text-slate-700 font-semibold mb-3">Thank you for your purchase</p>
          <p className="text-slate-600 font-mono bg-white px-4 py-2 rounded-lg inline-block border-2 border-emerald-300">
            Order #{order.order_number}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-6">📦 Order Items</h2>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center gap-3 flex-1">
                  <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-emerald-700">{formatPKR(item.line_total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gradient-to-br from-cyan-50 to-emerald-50 border-2 border-cyan-300 rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text mb-6">💰 Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-slate-700 pb-3 border-b-2 border-cyan-300">
              <span className="font-semibold">Subtotal:</span>
              <span className="font-bold">{formatPKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-3 border-b-2 border-cyan-300">
              <span className="font-semibold">🚚 Shipping:</span>
              <span className="font-bold text-emerald-700">{formatPKR(order.shipping_fee)}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-3 border-b-2 border-cyan-300">
              <span className="font-semibold">📊 Tax:</span>
              <span className="font-bold text-emerald-700">{formatPKR(order.tax)}</span>
            </div>
            <div className="flex justify-between bg-white rounded-lg p-4 border-2 border-cyan-300">
              <span className="font-bold text-lg text-slate-900">Total Amount:</span>
              <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text">{formatPKR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border-2 border-emerald-300 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600 font-semibold mb-2">Order Status</p>
            <p className={`inline-block bg-gradient-to-r ${getStatusColor(order.order_status)} text-white font-bold px-4 py-2 rounded-full capitalize`}>
              {order.order_status}
            </p>
          </div>
          <div className="bg-white border-2 border-cyan-300 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600 font-semibold mb-2">Payment Status</p>
            <p className={`inline-block bg-gradient-to-r ${getStatusColor(order.payment_status)} text-white font-bold px-4 py-2 rounded-full capitalize`}>
              {order.payment_status}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-y-3">
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg transition-all"
          >
            🛍️ Continue Shopping
          </Link>
          <p className="text-sm text-slate-600">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
