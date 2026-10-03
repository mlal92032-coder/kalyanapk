import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import ReviewsManagementClient from "@/components/ReviewsManagementClient";

export const metadata = {
  title: "Review Management",
};

export default async function ReviewsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login");

  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Review Management</h1>
          <p className="text-neutral-600 mt-2">Moderate customer reviews and manage ratings</p>
        </div>

        <ReviewsManagementClient />
      </main>
    </>
  );
}
