# Kalyana — Owner Controlled B2B Marketplace

A full-stack B2B marketplace (Alibaba-style) built with **Next.js (App Router) + SQLite (better-sqlite3)**.
Everything the Owner does in the C-Panel is read live from the database by the public website —
nothing important is hardcoded.

This is Phase 1: the **core end-to-end flow** — products, categories, suppliers, bulk pricing,
cart, checkout, orders, and the matching Owner C-Panel screens to manage all of it.

## Quick Start

```bash
npm install
npm run build
npm run start
```

The app runs on http://localhost:3000 by default.

For development with hot reload:

```bash
npm run dev
```

The SQLite database is created automatically on first run at `data/kalyana.db`, along with seed
data (see below). Delete that file to reset to a fresh seeded state.

## Admin Panel (Separate App)

⚠️ **The admin panel is now a completely separate Next.js application for security.**

The owner C-Panel has been moved to its own app to:
- ✅ Isolate admin code from public-facing code
- ✅ Reduce the public app's attack surface
- ✅ Allow independent scaling and deployment
- ✅ Apply stricter security policies to admin routes

**See `../kalyana-admin/README.md` for admin setup and login instructions.**

## What's included in this phase

**Public website**
- Homepage — hero heading/subheading/button, categories, and featured products are all pulled
  live from the database (edit them from the C-Panel → **Homepage & Settings**, no code changes)
- Category browsing, full-text product search, product detail pages
- Live bulk-pricing calculator on the product page — quantity changes recalculate price via a
  **server-side** endpoint (`/api/quote`), so the browser never invents a price
- Cart (cookie-based guest cart) and checkout — the **server recalculates every price and total**
  at checkout time from the database; the browser's numbers are never trusted
- Order confirmation page
- Supplier directory and supplier profile pages
- Contact page (owner-editable contact details)

**Owner C-Panel** (`/admin`)
- Secure login (bcrypt password hashing + JWT session cookie), all `/admin/*` and `/api/admin/*`
  routes protected by middleware
- Dashboard with actionable stat cards (published products, pending orders, low stock, revenue)
  and a low-stock alert list
- **Products**: full CRUD, draft/published/hidden/archived status, bulk pricing tier editor
  (add/edit/remove tiers — e.g. change "50–99 → $6" to "$5.50" and it's instantly live on the
  product page, no code changes), inventory tracking with automatic history logging
- **Categories**: CRUD with parent/child nesting, publish/hide, and delete protection — if a
  category is in use by products or subcategories, deletion is blocked with a precise usage count
  instead of silently breaking the site
- **Suppliers**: CRUD, verification badge toggle, suspend/activate; deleting a supplier with
  linked products suspends it instead of destroying data
- **Orders**: list with status filter, detail view with full line items and pricing breakdown,
  order status and payment status updates
- **Homepage & Settings**: edit the hero heading/subheading/button, business name, contact info,
  and footer text — all reflected live on the public site

**Data integrity rules already implemented**
- Deleting a product with historical order line items archives it instead of destroying the
  record (preserves order history)
- Deleting a supplier with linked products suspends it instead of deleting
- Deleting a category in use by products or subcategories is blocked with an explanation
- Every price a customer ever sees or pays is computed server-side from the database at request
  time — the client never supplies a price that's trusted
- Stock is decremented atomically at checkout and every stock change is written to an inventory
  log

## Project structure

### Public App (this directory)
```
app/
  page.js                     Public homepage
  products/                   Product listing + detail pages
  category/[slug]/            Category pages
  suppliers/                  Supplier directory + detail
  cart/, checkout/            Cart & checkout (client components)
  order-confirmation/[id]/    Order confirmation
  contact/                    Contact page
  api/
    products/, categories/, cart/, checkout/, quote/, settings/   Public endpoints
components/                   Shared React components (header, footer, forms, cart/checkout UI)
lib/
  db.js         SQLite schema + seed data
  pricing.js    Server-side bulk pricing engine — the single source of truth for all prices
  auth.js       Admin JWT session helpers
  cart.js       Guest cart cookie/session helper
  settings.js   Owner-editable site content (homepage copy, contact info)
  activity.js   Audit log writer
data/           SQLite database file lives here (gitignored)
```

### Admin App (separate: `../kalyana-admin/`)
```
app/
  login/                      Owner login (public, not authenticated)
  (panel)/                    Route group — authenticated admin pages
    dashboard/, products/, categories/, suppliers/, orders/, settings/
  api/
    login/, logout/           Authentication endpoints
    products/, categories/, suppliers/, orders/, dashboard/, settings/   Admin endpoints
components/
  AdminSidebar.jsx            Navigation for admin panel
lib/                          Shared with public app (db, auth, etc.)
middleware.js                 Protects all admin routes (runs on Node.js runtime)
```

The database is **shared** between both apps at `data/kalyana.db`.

## Not yet built (next phases, per the original spec)

This phase focused on the core, fully-working transactional flow. Not yet implemented from the
full 52-section spec: media library with image "used by" tracking and replace/delete-guard,
homepage section drag-and-drop reordering and additional homepage sections (flash deals, top
suppliers, testimonials, newsletter, etc.), product variants (color/size matrices), RFQ system,
buyer↔supplier↔support messaging, product reviews, CSV/Excel bulk import, bulk table actions,
customer accounts/login, coupons, shipping rule configuration, payment gateway integration,
analytics charts, notifications, multiple admin users with granular roles, and a visible audit
log UI (the backend `activity_logs` table is already being written to by every admin action).

The database schema, pricing engine, and admin/public separation were designed so these can be
added incrementally without restructuring what's already here.
