"use client";

import { useState } from "react";

export default function PaymentModal({ order, onClose, onPaymentSuccess }) {
  const [selectedGateway, setSelectedGateway] = useState("jazzcash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);

  const gateways = [
    {
      id: "jazzcash",
      name: "JazzCash",
      icon: "💳",
      description: "Fast and secure payments via JazzCash",
      color: "from-red-500 to-pink-500"
    },
    {
      id: "easypaisa",
      name: "EasyPaisa",
      icon: "📱",
      description: "Pay directly from your EasyPaisa account",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: "🏦",
      description: "Transfer to our bank account",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: "💵",
      description: "Pay cash when your order arrives",
      color: "from-green-500 to-emerald-500"
    }
  ];

  async function handlePayment() {
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          gateway: selectedGateway
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment failed");
        setProcessing(false);
        return;
      }

      // Store payment details for display
      if (data.payment) {
        setPaymentDetails(data.payment);
        // For COD and bank, don't redirect immediately
        if (selectedGateway === 'cod' || selectedGateway === 'bank') {
          setTimeout(() => {
            onPaymentSuccess(data);
          }, 3000);
        } else {
          // For online methods, process faster
          setTimeout(() => {
            onPaymentSuccess(data);
          }, 2000);
        }
      }
    } catch (err) {
      setError("Payment error. Please try again.");
      setProcessing(false);
    }
  }

  const gateway = gateways.find(g => g.id === selectedGateway);

  // Show payment details if available
  if (paymentDetails) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {selectedGateway === 'bank' && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
                <h2 className="text-2xl font-bold mb-2">Bank Transfer Details</h2>
                <p className="text-sm text-blue-50">Please transfer to the account below</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-semibold">Bank Name</p>
                    <p className="font-bold text-slate-900">{paymentDetails.bankDetails.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-semibold">Account Title</p>
                    <p className="font-bold text-slate-900">{paymentDetails.bankDetails.accountTitle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-semibold">Account Number</p>
                    <p className="font-mono font-bold text-slate-900 text-lg">{paymentDetails.bankDetails.accountNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-semibold">IBAN</p>
                    <p className="font-mono font-bold text-slate-900">{paymentDetails.bankDetails.iban}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-semibold">Amount to Transfer</p>
                    <p className="text-2xl font-bold text-blue-600">₨ {paymentDetails.bankDetails.amount.toLocaleString('en-PK')}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3 text-sm text-yellow-800">
                  <p className="font-semibold mb-1">⏱️ Time Limit</p>
                  <p>Please complete the transfer within 48 hours. Your order will be confirmed upon receipt of payment.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-2">
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-2 rounded-lg transition-all"
                >
                  I have transferred the amount
                </button>
              </div>
            </>
          )}

          {selectedGateway === 'cod' && (
            <>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                <h2 className="text-2xl font-bold mb-2">Cash on Delivery</h2>
                <p className="text-sm text-green-50">Payment on delivery confirmed</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <p className="text-5xl mb-4">✅</p>
                  <p className="font-bold text-slate-900 mb-2">Payment Method Confirmed</p>
                  <p className="text-slate-600">You will pay</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">₨ {order.total.toLocaleString('en-PK')}</p>
                  <p className="text-slate-600 mt-2">when your order is delivered</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">📦 What to expect</p>
                  <p>Our delivery agent will bring your order. You can inspect it and pay with cash upon receipt.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-2 rounded-lg transition-all"
                >
                  Complete Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Complete Payment</h2>
          <p className="text-sm text-emerald-50">Order #{order.order_number}</p>
        </div>

        {/* Order Total */}
        <div className="p-6 border-b border-emerald-100 bg-emerald-50">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-semibold">Total Amount:</span>
            <span className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text">
              ₨ {order.total.toLocaleString('en-PK')}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-3">
          {gateways.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGateway(g.id)}
              disabled={processing}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedGateway === g.id
                  ? `border-emerald-500 bg-emerald-50 shadow-lg`
                  : `border-slate-200 hover:border-emerald-300`
              } ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{g.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900">{g.name}</div>
                  <div className="text-xs text-slate-500">{g.description}</div>
                </div>
                {selectedGateway === g.id && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 space-y-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Processing Payment…" : `Pay ₨ ${order.total.toLocaleString('en-PK')}`}
          </button>
          <button
            onClick={onClose}
            disabled={processing}
            className="w-full border-2 border-slate-300 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Security Badge */}
        <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-center gap-2 text-xs text-emerald-700">
          <span>🔒</span>
          <span>Secure payment processing</span>
        </div>
      </div>
    </div>
  );
}
