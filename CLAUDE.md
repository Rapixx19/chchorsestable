# CLAUDE.md - Project Context for Claude Code

## Project Overview

**CHC (Coaching Horse Company)** - A multi-tenant stable management SaaS for equestrian businesses. Handles clients, horses, services, assignments, invoicing, and billing.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Deployment:** Fly.io (Docker, standalone build)

## Directory Structure

```
src/
├── app/                    # Next.js pages & API routes
│   ├── api/               # API endpoints (invoices, PDF, Telegram)
│   ├── dashboard/         # Main dashboard
│   ├── clients/           # Client management
│   ├── horses/            # Horse management
│   ├── services/          # Service catalog
│   ├── assignments/       # Service assignments
│   ├── invoices/          # Invoice views
│   ├── billing/           # Billing periods & payments
│   ├── login/             # Authentication
│   └── onboarding/        # New user setup
│
├── modules/               # Feature modules (domain-driven)
│   ├── stable/            # Multi-tenant core
│   ├── auth/              # Authentication
│   ├── clients/           # Client CRUD
│   ├── horses/            # Horse CRUD
│   ├── services/          # Service catalog
│   ├── assignments/       # Service-client linking
│   ├── invoices/          # Invoice generation
│   ├── billing/           # Payment processing
│   ├── notifications/     # Telegram notifications
│   ├── imports/           # PDF import/parsing
│   ├── analytics/         # Reporting
│   └── dashboard/         # Dashboard UI
│
├── infra/                 # Infrastructure
│   └── supabase/          # Supabase clients & types
│
└── middleware.ts          # Route protection
```

## Module Architecture

Each module follows: **Domain → Services → UI**

```
/module-name
├── domain/              # Pure logic (no IO, 100% testable)
│   ├── module.types.ts
│   └── module.logic.ts
├── services/            # IO operations (DB, APIs)
│   └── module.service.ts
├── ui/                  # React components
│   └── Component.tsx
└── tests/               # Unit & integration tests
```

## Safety Levels

File headers indicate risk level:

```typescript
/**
 * @module module-name
 * @description What this does
 * @safety GREEN|YELLOW|RED
 */
```

| Level | Meaning | Examples |
|-------|---------|----------|
| GREEN | UI, low risk | Dashboard components, styling |
| YELLOW | Business logic, moderate risk | Services, validation |
| RED | Critical, high risk | Auth, billing, invoices, infra |

## Key Rules

1. **Multi-tenancy:** All queries must filter by `stable_id`
2. **No hard deletes:** Use `archived` flags instead
3. **Immutable invoices:** Cannot modify after approval
4. **Pure domain logic:** No external deps in `/domain`
5. **Respect boundaries:** UI → Services → Domain → DB

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests
npm run test:run     # Tests without watch
npm run test:e2e     # Playwright E2E
```

## Database Tables

| Table | Purpose |
|-------|---------|
| stables | Multi-tenant organizations |
| clients | Customer records |
| horses | Horse records |
| services | Service catalog (pricing) |
| assignments | Service-client-horse links |
| invoices | Invoice headers |
| invoice_lines | Invoice line items |
| billing_periods | Billing cycles |
| payments | Payment records |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TELEGRAM_BOT_TOKEN= (optional)
```

## Testing Requirements

- **Domain logic:** 100% coverage
- **Services:** 90% coverage
- **Critical modules (auth/billing/invoices):** 100% coverage

## Before Editing

1. Read the file's `@safety` level in JSDoc header
2. Understand module boundaries
3. Check for existing tests
4. RED files require extra validation

## Common Patterns

**Service result type:**
```typescript
{ success: boolean; error?: string; data?: T }
```

**Financial calculations:**
- All amounts in cents (`price_cents`, `total_cents`)
- Use pure functions for calculations
- Billing units: `monthly`, `per_session`, `one_time`
