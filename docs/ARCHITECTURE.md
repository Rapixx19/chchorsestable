# SYSTEM ARCHITECTURE

## Layers

UI → Services → Domain → Database

Domain layer contains pure logic.

Services handle IO.

---

## Modules

auth
clients
services
subscriptions
billing
invoices

Each module is independent.

---

## Multi-Tenant Model

stable_id exists in all business tables.

Authorization enforced via Supabase RLS.

---

## Financial Safety

Invoices immutable after issue.

Deterministic billing.

No hard deletes.
