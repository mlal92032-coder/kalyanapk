import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm productId={id} />
    </div>
  );
}
