"use client";

import { useState } from "react";
import ProductForm from "@/components/ProductForm";
import ProductVariants from "@/components/ProductVariants";

export default function EditProductPage({ params }) {
  const [refreshVariants, setRefreshVariants] = useState(0);
  const id = params.id;

  const handleProductUpdated = () => {
    // Refresh variants component when product is updated
    setRefreshVariants(prev => prev + 1);
  };

  return (
    <div className="flex-1 p-8 w-full overflow-auto">
      <div className="max-w-5xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-2">Edit Product</h1>
          <p className="text-slate-600">Manage product details, pricing, colors, sizes, and variants all in one place</p>
        </div>

        {/* Product Form Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-12 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">📦 Product Information</h2>
          <ProductForm productId={id} onProductCreated={handleProductUpdated} />
        </div>

        {/* Colors, Sizes & Variants Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">🎨 Colors, Sizes & Variants</h2>
          <p className="text-sm text-slate-600 mb-6">Manage all product variations, colors, and sizes here</p>
          <ProductVariants key={refreshVariants} productId={id} />
        </div>
      </div>
    </div>
  );
}
