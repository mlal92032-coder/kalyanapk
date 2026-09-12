import Link from "next/link";
import { getAllSettings } from "@/lib/settings";

export default function SiteFooter() {
  const settings = getAllSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-blue-950 via-teal-950 to-slate-950 text-slate-300 mt-auto relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10">
        {/* Newsletter Section */}
        <div className="border-b border-emerald-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text mb-2">
                  Stay Updated
                </h3>
                <p className="text-cyan-100">Subscribe to our newsletter for exclusive deals and updates</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-cyan-500/30 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all hover:scale-105">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Kalyana" className="h-14 w-14 object-cover rounded-lg shadow-lg" />
                <div className="text-white text-lg font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  {settings.business_name || "Kalyana"}
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {settings.footer_text || "Premium quality products delivered with excellence and integrity."}
              </p>
              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                <Link href="#" className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 hover:bg-emerald-500/40 transition-all hover:scale-110">
                  f
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/40 transition-all hover:scale-110">
                  𝕏
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/40 transition-all hover:scale-110">
                  📷
                </Link>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/products" className="text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-2">
                    <span className="text-emerald-500">→</span> All Products
                  </Link>
                </li>
                <li>
                  <Link href="/suppliers" className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <span className="text-cyan-500">→</span> Our Suppliers
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-slate-400 hover:text-yellow-300 transition-colors flex items-center gap-2">
                    <span className="text-yellow-500">→</span> About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-2">
                    <span className="text-emerald-500">→</span> Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Support</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <span className="text-cyan-500">→</span> Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-2">
                    <span className="text-emerald-500">→</span> Track Order
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-slate-400 hover:text-yellow-300 transition-colors flex items-center gap-2">
                    <span className="text-yellow-500">→</span> Returns
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <span className="text-cyan-500">→</span> FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">📧</span>
                  <div>
                    <div className="text-slate-400">Email</div>
                    <div className="text-white">{settings.contact_email || "info@kalyana.com"}</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">📞</span>
                  <div>
                    <div className="text-slate-400">Phone</div>
                    <div className="text-white">{settings.contact_phone || "+1 (555) 123-4567"}</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">📍</span>
                  <div>
                    <div className="text-slate-400">Address</div>
                    <div className="text-white text-xs">{settings.contact_address || "123 Peacock Lane, City, Country"}</div>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Payment Methods */}
          <div className="border-t border-emerald-900/30 pt-8 pb-8">
            <h4 className="text-white font-bold mb-4">We Accept</h4>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-white/5 border border-emerald-400/30 rounded-lg text-slate-400 text-sm font-semibold hover:border-emerald-400/60 transition-all">
                💳 Credit Card
              </div>
              <div className="px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-slate-400 text-sm font-semibold hover:border-cyan-400/60 transition-all">
                🏦 Bank Transfer
              </div>
              <div className="px-4 py-2 bg-white/5 border border-yellow-400/30 rounded-lg text-slate-400 text-sm font-semibold hover:border-yellow-400/60 transition-all">
                📱 Mobile Payment
              </div>
              <div className="px-4 py-2 bg-white/5 border border-emerald-400/30 rounded-lg text-slate-400 text-sm font-semibold hover:border-emerald-400/60 transition-all">
                💰 Crypto
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-900/30 bg-white/5 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-500">
                © {currentYear} {settings.business_name || "Kalyana"}. All rights reserved.
              </div>
              <div className="flex gap-6 text-sm">
                <Link href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-slate-400 hover:text-cyan-300 transition-colors">Terms of Service</Link>
                <Link href="#" className="text-slate-400 hover:text-yellow-300 transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
