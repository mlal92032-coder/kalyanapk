# Kalyana - Separated Public & Admin Apps Setup Guide

Your Kalyana marketplace has been successfully separated into two independent Next.js applications for enhanced security.

## 📂 Directory Structure

```
kalyana/
  ├── kalyana/           → Public marketplace app
  └── kalyana-admin/     → Admin panel app (separate & isolated)
```

## 🚀 Quick Start

### Option 1: Run Both Apps (Recommended for Development)

**Terminal 1 - Public App (port 3000):**
```bash
cd kalyana
npm run dev
```

**Terminal 2 - Admin App (port 3001):**
```bash
cd kalyana-admin
npm install --ignore-scripts
npm run dev
```

### Option 2: Run Individual Apps

**Public Marketplace Only:**
```bash
cd kalyana
npm run dev
# Access at http://localhost:3000
```

**Admin Panel Only:**
```bash
cd kalyana-admin
npm install --ignore-scripts
npm run dev
# Access at http://localhost:3001/login
```

## 🔑 Admin Login

Access the admin panel at: **http://localhost:3001/login**

Default credentials:
- **Email:** `owner@kalyana.test`
- **Password:** `Kalyana@123`

⚠️ **Change these credentials before production deployment.**

## 📋 Configuration

### Admin App Environment Variables

Create `.env.local` in `kalyana-admin/`:

```bash
# Required: Set a strong secret for JWT tokens
ADMIN_JWT_SECRET=your-very-long-random-secret-key-here

# Optional: Point to shared database (auto-detected if not set)
DATABASE_PATH=../kalyana/data/kalyana.db
```

### Public App Environment Variables

The public app uses the same database by default. No additional configuration needed for basic setup.

## 🛠️ Development

### Making Changes

**Public App Changes:**
- Edit files in `kalyana/app/`, `kalyana/components/`, `kalyana/lib/`
- Changes are reflected at http://localhost:3000

**Admin Panel Changes:**
- Edit files in `kalyana-admin/app/`, `kalyana-admin/components/`
- Changes are reflected at http://localhost:3001

### Shared Files

Both apps share:
- **Database:** `kalyana/data/kalyana.db` (single SQLite file)
- **Libraries:** 
  - `lib/db.js` - Database schema and seed data
  - `lib/auth.js` - Authentication helpers
  - `lib/pricing.js` - Pricing engine
  - `lib/settings.js` - Site settings
  - `lib/activity.js` - Audit logging

These files are duplicated in each app to avoid cross-app dependencies while maintaining functionality.

## 📦 Building for Production

### Public App Build
```bash
cd kalyana
npm run build
npm start
```

### Admin App Build
```bash
cd kalyana-admin
npm run build
npm start
```

## 🔒 Security Benefits

✅ **Isolated Codebase:** Admin code is completely separate from public code
✅ **Reduced Attack Surface:** Public app has no admin functionality
✅ **Independent Deployment:** Deploy to different domains/servers
✅ **Separate Security Policies:** Can apply stricter policies to admin (e.g., IP whitelisting, stronger CORS)
✅ **Independent Scaling:** Each app can scale based on actual demand

## 📡 Deployment Considerations

### Separate Domains (Recommended)

```
www.kalyana.com          → Public marketplace (kalyana/)
admin.kalyana.com        → Admin panel (kalyana-admin/)
```

### Same Domain (Subdirectory)

```
kalyana.com/            → Public app
kalyana.com/admin/      → Admin app
```
*Requires reverse proxy configuration (nginx/Apache)*

## 🗄️ Database

- **Single shared database:** `kalyana/data/kalyana.db`
- Both apps read/write to the same database
- All data created in one app is immediately visible in the other
- SQLite handles concurrent access safely with WAL mode

## 🐛 Troubleshooting

### Admin app can't connect to database
Check that:
1. Database file exists at `kalyana/data/kalyana.db`
2. Permissions allow read/write access
3. `DATABASE_PATH` environment variable is correct (if set)

### Port already in use
Change the port in `package.json`:
```json
// Admin app
"dev": "next dev -p 3002"  // Use port 3002 instead
```

### Admin login not working
- Ensure admin app is running on port 3001 (or configured port)
- Check that `ADMIN_JWT_SECRET` is set and consistent
- Clear browser cookies and try again

## ✨ What's New in This Setup

| Aspect | Before | After |
|--------|--------|-------|
| Admin Code | Mixed with public | Completely separate |
| Deployments | Single app | Two independent apps |
| Security Risk | Higher (admin code exposed if public compromised) | Lower (isolated) |
| Codebase Size | Larger | Two smaller apps |
| Scaling | Limited | Independent per app |
| Database | Shared | Shared (optimal) |

## 📚 Further Reading

- **Public App:** See `kalyana/README.md` for detailed features
- **Admin App:** See `kalyana-admin/README.md` for admin-specific details
- **API Documentation:** Check individual app READMEs for API endpoints

## 🎯 Next Steps

1. ✅ Both apps are ready to run
2. Install dependencies: `npm install` in each directory (already done for public)
3. Start both servers in separate terminals
4. Test the public marketplace at http://localhost:3000
5. Test the admin panel at http://localhost:3001
6. Deploy to production when ready

---

**Questions?** Check the README.md files in each app directory.
