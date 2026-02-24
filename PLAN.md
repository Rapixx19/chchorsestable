# Dashboard Bento Layout Implementation Plan

## Overview

Replace the existing dashboard with a premium Bento-style layout featuring reusable KpiCard components, glass-morphism styling, and a split-view activity/status panel.

**Safety Level**: GREEN (UI components only)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | MODIFY | Add `glass-card` utility class |
| `src/modules/dashboard/ui/KpiCard.tsx` | CREATE | Reusable single KPI card component |
| `src/modules/dashboard/ui/index.ts` | MODIFY | Export KpiCard |
| `src/app/(app)/dashboard/page.tsx` | REPLACE | New Bento-style dashboard layout |

---

## Implementation Details

### 1. Add glass-card CSS class

**File:** `src/app/globals.css`

Add after the `@theme inline` block:
```css
.glass-card {
  background: rgba(24, 24, 27, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(63, 63, 70, 0.5);
}
```

### 2. Create KpiCard Component

**File:** `src/modules/dashboard/ui/KpiCard.tsx`

Props interface:
- `label: string` - Card title
- `value: string` - Display value
- `icon: LucideIcon` - Icon component
- `trend?: string` - Optional trend indicator (e.g., "+12%")
- `variant: 'gold' | 'emerald' | 'zinc'` - Color scheme

Features:
- Uses design tokens (stable-gold, stable-emerald, surface colors)
- Hover animation with scale transform
- Optional trend badge with up/down indicator
- Glass-morphism background

### 3. Update Dashboard Page

**File:** `src/app/(app)/dashboard/page.tsx`

Layout structure:
```
┌─────────────────────────────────────────────────────┐
│ Header: "Dashboard Overview" + Create Invoice btn   │
├──────────┬──────────┬──────────┬──────────────────┤
│ KpiCard  │ KpiCard  │ KpiCard  │ KpiCard           │
│ Revenue  │ Horses   │ Clients  │ Pending           │
├──────────┴──────────┴──────────┼──────────────────┤
│ Recent Activity                │ Stable Status     │
│ (2 cols span)                  │ - Barn Capacity   │
│ Activity feed placeholder      │ - Invoices Status │
└────────────────────────────────┴──────────────────┘
```

Key components:
- Header with quick action button
- 4-column KPI grid (responsive)
- 3-column split: Activity (2 cols) + Status (1 col)
- StatusItem helper for progress bars

### 4. Update Exports

**File:** `src/modules/dashboard/ui/index.ts`

Add:
```ts
export { KpiCard } from './KpiCard';
```

---

## Notes

- The existing `KpiCards.tsx` (plural) can be kept for backward compatibility or removed later
- Data fetching is mocked with static values; hook into analytics service in future iteration
- `glass-card` class enables glass-morphism effect consistent with modern dark theme
- StatusItem is a local helper component (not exported)

---

## Verification

1. `npx eslint src/` - No new lint errors
2. Visual check: Navigate to `/dashboard`
   - KPI cards render with correct colors
   - Glass effect visible on activity/status panels
   - Responsive grid collapses correctly on mobile
