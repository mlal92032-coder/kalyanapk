# Kalyana Admin Panel

This is the **separate** owner/admin application for the Kalyana B2B marketplace. It runs independently from the public website for enhanced security.

## Why Separate?

- **Security**: The admin panel is completely isolated from the public-facing marketplace
- **Performance**: Public app is lighter without admin code
- **Deployment**: Can deploy to different domains/servers with different security policies
- **Scalability**: Admin and public apps can scale independently

## Quick Start

```bash
npm install
npm run dev
```

The admin panel runs on **http://localhost:3001** by default.

## Setup

### 1. Install Dependencies
```bash
npm install --ignore-scripts
```

### 2. Configure Database Path
Create a `.env.local` file:
```
ADMIN_JWT_SECRET=change-this-to-a-long-random-string
DATABASE_PATH=../kalyana/data/kalyana.db
```

### 3. Development
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
npm start
```

## Admin Login

Visit **http://localhost:3001/login**

Seeded account:
- Email: `owner@kalyana.test`
- Password: `Kalyana@123`

⚠️ Change these credentials immediately in production. Modify the password or create a new admin user directly in the database.

## Features

- **Dashboard**: Overview of products, orders, inventory, and revenue
- **Products**: CRUD with draft/published/hidden/archived status, bulk pricing
- **Categories**: Hierarchy management with usage protection
- **Suppliers**: Verification, suspension, and management
- **Orders**: Viewing and status management
- **Homepage Settings**: Edit all public-facing content

## Shared Database

Both the public app and admin panel share the same SQLite database located at `../kalyana/data/kalyana.db`. Make sure both apps have read/write access to this file.

## Architecture

```
kalyana/                    Public marketplace
  app/                      Public pages only
  api/                      Public APIs only
  lib/                      Shared libraries
  data/kalyana.db           Shared database
  
kalyana-admin/              Admin panel (this app)
  app/                      Admin pages
  api/                      Admin APIs
  lib/                      Admin libraries (shared schema with main app)
  middleware.js             Auth protection
```

## Security

- All admin routes are protected by JWT middleware (`middleware.js`)
- Passwords are hashed with bcryptjs
- Session tokens expire after 7 days
- HTTP-only cookies prevent XSS attacks
- Use strong `ADMIN_JWT_SECRET` in production
