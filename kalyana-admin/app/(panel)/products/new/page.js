"use client";

import { useState } from "react";
import ProductForm from "@/components/ProductForm";
import ProductVariants from "@/components/ProductVariants";

export default function NewProductPage() {
  const [createdProductId, setCreatedProductId] = useState(null);

  return (
    <div className="flex-1 p-8 w-full overflow-auto">
      <div className="max-w-5xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-2">Add Product</h1>
          <p className="text-slate-600">Create a new product with colors, sizes, and variants</p>
        </div>

        {/* Product Form Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-12 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Product Information</h2>
          <ProductForm onProductCreated={setCreatedProductId} />
        </div>

        {/* Colors, Sizes & Variants Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">🎨 Colors, Sizes & Variants</h2>
          <p className="text-sm text-slate-600 mb-6">Add colors, sizes, and create product variants</p>
          {createdProductId ? (
            <ProductVariants productId={createdProductId} />
          ) : (
            <div className="text-center py-8 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
              <p>👆 Save the product above first, then add colors, sizes, and variants here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
