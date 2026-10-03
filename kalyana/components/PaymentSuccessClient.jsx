"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PaymentSuccessClient({ order, items, payment }) {
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "kalyana_last_order",
      JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        completedAt: new Date().toISOString(),
      })
    );
  }, [order]);

  const formatPKR = (amount) => {
    return `₨ ${parseFloat(amount).toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`/api/invoice/${order.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${order.order_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const getPaymentMethodDisplay = (gateway) => {
    const methods = {
      'jazzcash': '💳 JazzCash',
      'easypaisa': '📱 EasyPaisa',
      'bank': '🏦 Bank Transfer',
      'cod': '💵 Cash on Delivery'
    };
    return methods[gateway] || gateway;
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl p-8 mb-8 text-center">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-2">
          Payment Successful!
        </h1>
        <p className="text-slate-700 font-semibold mb-4">Your order has been confirmed</p>
        <p className="text-slate-600 font-mono bg-white px-6 py-3 rounded-lg inline-block border-2 border-emerald-300 font-bold">
          Order #{order.order_number}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Payment Details Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white border-2 border-emerald-300 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-emerald-700 mb-6">📦 Order Summary</h2>

            <div className="space-y-3 mb-6">
              {items.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-b-0">
                  <div>
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-emerald-700">{formatPKR(item.line_total)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-4 space-y-2 border border-emerald-200">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatPKR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>🚚 Shipping:</span>
                <span className="font-semibold">{formatPKR(order.shipping_fee)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>📊 Tax:</span>
                  <span className="font-semibold">{formatPKR(order.tax)}</span>
                </div>
              )}
              <div className="border-t-2 border-emerald-200 pt-2 flex justify-between">
                <span className="font-bold text-lg text-slate-900">Total Amount</span>
                <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text">
                  {formatPKR(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">💳 Payment Information</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-slate-600 font-semibold mb-1">Payment Method</p>
                <p className="text-xl font-bold text-blue-700">{getPaymentMethodDisplay(payment.gateway)}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-slate-600 font-semibold mb-1">Transaction ID</p>
                <p className="font-mono text-sm font-bold text-slate-900">{payment.transactionId}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-slate-600 font-semibold mb-1">Payment Date</p>
                <p className="font-bold text-slate-900">{new Date().toLocaleString('en-PK')}</p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                <p className="font-semibold text-green-700 mb-1">✅ Status: Completed</p>
                <p className="text-sm text-green-600">Your payment has been successfully processed</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white border-2 border-yellow-300 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-700 mb-6">🚚 Delivery Information</h2>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-slate-600 font-semibold mb-1">Shipping Address</p>
                <p className="text-slate-900 whitespace-pre-wrap">{order.shipping_address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Estimated Delivery</p>
                  <p className="font-bold text-slate-900">3-5 Business Days</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Tracking</p>
                  <p className="font-mono text-sm font-bold text-slate-900">{order.order_number}</p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-2">📧 Confirmation email sent to:</p>
                <p className="font-mono text-sm font-bold text-slate-900">{order.customer_email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          {/* Invoice Card */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-slate-900 mb-4">📄 Invoice</h3>
            <p className="text-sm text-slate-600 mb-4">Download or print your invoice for records.</p>

            <div className="space-y-3">
              <button
                onClick={handleDownloadInvoice}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>⬇️</span> Download PDF
              </button>
              <button
                onClick={handlePrintInvoice}
                className="w-full border-2 border-slate-300 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Print Invoice
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-emerald-700 mb-4">📋 Next Steps</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="text-lg">1️⃣</span>
                <span className="text-slate-700">Check your email for order confirmation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-lg">2️⃣</span>
                <span className="text-slate-700">Track your delivery with order number</span>
              </li>
              <li className="flex gap-3">
                <span className="text-lg">3️⃣</span>
                <span className="text-slate-700">Receive package in 3-5 business days</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-slate-900 mb-3">🆘 Need Help?</h3>
            <p className="text-sm text-slate-600 mb-4">Contact our support team</p>
            <div className="space-y-2 text-sm">
              <p className="text-slate-700">📧 <strong>support@kalyana.pk</strong></p>
              <p className="text-slate-700">📱 <strong>0300-1234567</strong></p>
              <p className="text-slate-700">🕐 <strong>Available 24/7</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-3">
        <Link
          href="/products"
          className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
        >
          🛍️ Continue Shopping
        </Link>
        <div>
          <Link
            href="/account"
            className="inline-block text-emerald-700 font-semibold hover:text-cyan-600 transition-colors"
          >
            View My Orders →
          </Link>
        </div>
      </div>
    </main>
  );
}
