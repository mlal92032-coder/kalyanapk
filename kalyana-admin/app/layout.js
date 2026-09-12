import "./globals.css";

export const metadata = {
  title: "Kalyana — Owner C-Panel",
  description: "Admin panel for managing Kalyana B2B marketplace.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full w-full antialiased">
      <body className="min-h-full w-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 text-slate-900 font-sans">
        <div className="flex flex-1 w-full">
          {children}
        </div>
        <AdminFooter />
      </body>
    </html>
  );
}

function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-950 via-teal-950 to-emerald-950 text-slate-300 border-t border-emerald-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Kalyana" className="h-12 w-12 object-cover rounded-lg shadow-lg" />
              <span className="font-bold text-white">Kalyana Admin</span>
            </div>
            <p className="text-sm text-slate-400">Manage your B2B marketplace with ease</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Dashboard</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/dashboard" className="text-slate-400 hover:text-emerald-300 transition-colors">Dashboard</a></li>
              <li><a href="/products" className="text-slate-400 hover:text-cyan-300 transition-colors">Products</a></li>
              <li><a href="/categories" className="text-slate-400 hover:text-emerald-300 transition-colors">Categories</a></li>
              <li><a href="/orders" className="text-slate-400 hover:text-yellow-300 transition-colors">Orders</a></li>
            </ul>
          </div>

          {/* Settings */}
          <div>
            <h4 className="text-white font-bold mb-4">Management</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/suppliers" className="text-slate-400 hover:text-emerald-300 transition-colors">Suppliers</a></li>
              <li><a href="/settings" className="text-slate-400 hover:text-cyan-300 transition-colors">Settings</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Reports</a></li>
              <li><a href="#" className="text-slate-400 hover:text-yellow-300 transition-colors">Analytics</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-300 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Contact Support</a></li>
              <li><a href="#" className="text-slate-400 hover:text-yellow-300 transition-colors">Report Issue</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-emerald-700/30 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              © {currentYear} Kalyana Admin Panel. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-cyan-300 transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
