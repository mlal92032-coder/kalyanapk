import { getAllSettings } from "@/lib/settings";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const settings = getAllSettings();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-2xl font-bold mb-6">Contact {settings.business_name}</h1>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="border border-neutral-200 rounded-lg p-5 bg-white">
            <div className="text-sm text-neutral-500 mb-1">Email</div>
            <div className="font-medium">{settings.contact_email}</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-5 bg-white">
            <div className="text-sm text-neutral-500 mb-1">Phone</div>
            <div className="font-medium">{settings.contact_phone}</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-5 bg-white">
            <div className="text-sm text-neutral-500 mb-1">WhatsApp</div>
            <div className="font-medium">{settings.contact_whatsapp}</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-5 bg-white">
            <div className="text-sm text-neutral-500 mb-1">Address</div>
            <div className="font-medium">{settings.contact_address}</div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
