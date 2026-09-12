import { getAdminSession } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminPanelLayout({ children }) {
  const session = await getAdminSession();

  return (
    <div className="flex w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar adminName={session?.name || session?.email || "Owner"} />
      <div className="flex-1 min-w-0 flex flex-col w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
