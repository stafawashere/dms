# DMS

> Distributor Manager System — track inventory, products, and reseller sales across a distribution network.

## Features

**Role-Based Access** — admin and reseller portals with separate dashboards, permissions, and views

**Per-User Inventory** — each reseller maintains their own stock per product, managed through stock transfers

**Bulk Pricing Tiers** — define cost and sell prices per quantity range with automatic tier-based pricing

**Flexible Sale Pricing** — auto (tier-based), per-unit custom, or flat total pricing modes

**Reseller Management** — create accounts, assign inventory, track individual performance and sales history

**Reports & Analytics** — revenue charts, category breakdowns, and low stock alerts

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, Turbopack, server components
- [TypeScript](https://www.typescriptlang.org/) — type safety across the full stack
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — dark theme, base-nova style
- [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/) — serverless Postgres
- [Prisma 7](https://www.prisma.io/) — ORM with interactive transactions
- [NextAuth v5](https://authjs.dev/) — JWT authentication with role-based middleware

## Setup

Requires Node.js 18+ and a PostgreSQL database.

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET

# Run migrations
npx prisma migrate dev

# Seed admin user
npx prisma db seed

# Start dev server
npm run dev
```

## Project Structure
```
src/
  app/
    (auth)/           # Login page
    admin/            # Admin portal — dashboard, products, inventory, sales, resellers, reports
    reseller/         # Reseller portal — dashboard, sales, inventory, products
    api/              # REST API routes
  components/
    layout/           # Sidebar, header, mobile nav
    ui/               # shadcn/ui primitives
  lib/
    auth.ts           # NextAuth configuration
    db.ts             # Prisma client singleton
  generated/prisma/   # Generated Prisma client
prisma/
  schema.prisma       # Database schema
```

## License

MIT
