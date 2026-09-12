"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentModal({ order, onClose }) {
  const [selectedGateway, setSelectedGateway] = useState("jazzcash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentStep, setPaymentStep] = useState("select"); // select, processing, success
  const router = useRouter();

  const gateways = [
    {
      id: "jazzcash",
      name: "JazzCash",
      icon: "💳",
      description: "Fast and secure payments via JazzCash"
    },
    {
      id: "easypaisa",
      name: "EasyPaisa",
      icon: "📱",
      description: "Pay directly from your EasyPaisa account"
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: "🏦",
      description: "Transfer to our bank account"
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: "💵",
      description: "Pay cash when your order arrives"
    }
  ];

  async function handlePayment() {
    setProcessing(true);
    setError("");
    setPaymentStep("processing");

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
        setPaymentStep("select");
        setProcessing(false);
        return;
      }

      setPaymentStep("success");

      // Redirect after 2 seconds
      setTimeout(() => {
        const successUrl = `/payment-success/${order.id}?gateway=${selectedGateway}&transactionId=${data.payment.transactionId}`;
        router.push(successUrl);
      }, 2000);
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment error. Please try again.");
      setPaymentStep("select");
      setProcessing(false);
    }
  }

  if (paymentStep === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-center p-8">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">Payment Processing!</h2>
          <p className="text-slate-600 mb-4">Your payment has been initiated successfully.</p>
          <p className="text-sm text-slate-500">Redirecting to order details...</p>
        </div>
      </div>
    );
  }

  if (paymentStep === "processing") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-center p-8">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Payment...</h2>
          <p className="text-slate-600">Please wait while we process your payment.</p>
        </div>
      </div>
    );
  }

  const gateway = gateways.find(g => g.id === selectedGateway);

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
          <div className="mx-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
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
            {processing ? "Processing..." : `Pay ₨ ${order.total.toLocaleString('en-PK')}`}
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
