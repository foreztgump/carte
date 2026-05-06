# PRD: Carte — Restaurant Plugin for EmDash

> **Status:** Draft v0.1 · **Owner:** Claudeflare · **Last updated:** 2026-04-29
> **EmDash target:** ^0.9.0

---

## Overview

Carte is the restaurant plugin for EmDash. It manages menus, hours, reservations, and online ordering for independent restaurants — from single-location cafés to small chains. It ships as a small open-source MIT core (`@carte/core`) plus modular add-ons (`@carte/reservations`, `@carte/orders`, `@carte/ai`). Each add-on is its own EmDash plugin with its own capability manifest.

Carte is the first restaurant plugin designed for AI-native workflows. Through EmDash's MCP server, every Carte operation — 86 a sold-out item, change a price, block a reservation slot — is reachable from Claude Desktop, Cursor, or any MCP client. The included `@carte/ai` plugin (paid, with free trial) ships an in-admin chat panel that turns restaurant management into conversation.

## Problem Statement

EmDash has no restaurant solution. Restaurant owners coming from WordPress expect WPCafe, FoodMaster, Orderable, RestroFood, or GloriaFood. None exist for EmDash.

The WordPress restaurant plugin space has six chronic problems that EmDash architecture can solve at the level:

1. **Plugin sprawl.** A typical WP restaurant site needs WPCafe (menu) + Five Star (reservations) + GloriaFood (orders) + Yoast (SEO) + Smush (images). Five plugins, five upgrade cycles, five attack surfaces. Carte ships menus + reservations + orders coherently versioned.
2. **Update anxiety.** Restaurant owners cannot afford site downtime during dinner service. EmDash's sandboxed plugin model means a Carte bug cannot take down the rest of the site.
3. **AI is bolted on or absent.** No major WP restaurant plugin has native AI for menu/price/inventory operations. Carte's AI is the *primary* admin surface, not a feature add-on.
4. **Performance during peak hours.** WP restaurant plugins query the DB on every menu page load. Cloudflare edge cache + Portable Text means Carte serves menus from 300+ edge locations.
5. **Mobile checkout is an afterthought.** Most WP plugins were built desktop-first. Carte is mobile-first by design — 70%+ of food orders happen on phones.
6. **Schema.org is incomplete or wrong.** Most WP plugins emit broken or partial Restaurant/Menu JSON-LD. Carte emits canonical, complete JSON-LD that's eligible for Google rich results and AI agent ingestion.

## Target Users

- **Independent single-location restaurants** — full-service, fast-casual, café, bakery
- **Bars & taprooms** — drink menus, food menus, hours-sensitive availability
- **Food trucks** — single-location, hours/location updates frequent (perfect AI use case)
- **Ghost kitchens** — order-only, no dine-in
- **Small-chain restaurants (2-5 locations)** — v0.3 with multi-location

Out of scope for v0.1: 5+ location chains, enterprise franchises, wholesale food distribution, grocery/specialty food retail.

## v0.1 Constraints (locked with developer)

1. **Online ordering: IN.** Stripe-based ordering with cart, modifiers, time-slot delivery/pickup. Real client needs this at launch.
2. **Single location only.** Multi-location data model exists; multi-location UI is v0.3.
3. **AI is paid with free trial.** `@carte/ai` is the commercial plugin. Free trial: 14 days, then $99/yr.

This shifts v0.1 scope from 6 weeks to 12 weeks. Acceptable trade — single coherent launch beats two-phase releases for a real client.

---

## EmDash Architecture Constraints

These are non-negotiable runtime realities that shape every decision below.

1. **Two plugin formats:** standard (sandboxed, Block Kit JSON admin) vs. native (locally-registered, React allowed).
2. **Sandbox runtime limits:** 50ms CPU, 10 subrequests, 30s wall time, and ~128MB memory per sandboxed plugin invocation, per `github.com/emdash-cms/emdash/blob/main/skills/creating-plugins/SKILL.md`. Trusted (native or self-hosted Node) plugins are uncapped.
3. **`ctx.waitUntil` / `after()` mandatory** for any async work after the response (Issue #710).
4. **Block Kit gotchas:** `label` not `text`, `items` not `stats`, no markdown in section text, no HTTP redirects from plugin routes.
5. **Cloudflare Free plan:** No Dynamic Workers — Cloudflare Free cannot host sandboxed plugins, so standard plugins lose isolation and run trusted instead.
6. **Self-hosted Node:** Plugins run in-process; sandbox pitch applies fully only on Cloudflare.
7. **Plugin routes mount at:** `/_emdash/api/plugins/<plugin-id>/<route>`.
8. **No raw SQL** — plugins use `ctx.content.*`.
9. **`ctx.kv` is plugin-scoped automatically** — no declaration required.
10. **MCP is core** — `ctx.content.*` operations are MCP-exposed automatically. Custom MCP tool registration remains an open question until the v0.1 interim plan is applied.
11. **x402 is core** — micropayment gating is configured per content item; no plugin capability.

Verified capabilities used (per `github.com/emdash-cms/emdash/blob/main/skills/creating-plugins/SKILL.md`): `content:read`, `content:write`, `media:read`, `network:request` (with `allowedHosts`), `email:send`.

---

## Plugin Family

| Plugin | Format | License | v0.1 Pricing | Description |
|---|---|---|---|---|
| `@carte/core` | standard | MIT | Free | Menus, items, sections, restaurant info, hours, schema.org, x402 config |
| `@carte/reservations` | standard | MIT | Free | Booking form, time-slot logic, capacity, email confirmations |
| `@carte/orders-backend` | standard | MIT | Free | Stripe webhooks, cart hold logic, order state machine, email receipts |
| `@carte/orders-admin` | native | MIT | Free | React admin: order management, modifier editor, refund UI |
| `@carte/views` | native (peer dep npm) | MIT | Free | Astro components: menu, hours, reservation form, order cart |
| `@carte/ai` | native | Commercial | $99/yr (14-day free trial) | React chat panel, MCP tool wrappers, inline AI actions |

Bundles for v0.1: none. Single plugin family, AI as the only paid SKU. Future:
- **Carte Pro** (v0.3): `@carte/multi-location` + `@carte/floor-plan` + `@carte/ai`
- **Carte Operations** (v1.0): adds `@carte/delivery`, `@carte/qr-ordering`, advanced modifier engine

Dependency rules:
- `reservations`, `orders-backend`, `orders-admin`, `views`, `ai` all `require: ["@carte/core"]`
- `orders-admin` requires `orders-backend`
- `views` is npm peer dep installed in user's Astro project (not via marketplace)
- `ai` requires local registration (native format)

---

## Capability Manifests

### `@carte/core` (standard)
```typescript
import { definePlugin } from "emdash";

export default () => definePlugin({
  id: "carte-core",
  version: "0.1.0",
  capabilities: ["content:read", "content:write", "media:read"],
  // No external network, no email — fully self-contained
  hooks: {
    "content:beforeSave": async (event, ctx) => {
      if (!event.collection.startsWith("carte_")) return;
      // Validate menu item prices, normalize allergens, validate hours format
    },
    "content:afterSave": async (event, ctx) => {
      if (!event.collection.startsWith("carte_")) return;
      ctx.waitUntil(invalidateCarteCache(ctx, event));
    },
  },
  routes: ["admin", "menu-feed", "schema-jsonld"],
  storage: {
    settings: {
      defaultCurrency: "USD",
      defaultMenuLocale: "en",
      timezone: "America/Los_Angeles",
      x402WalletAddress: "",  // optional, for x402-gated content
    },
  },
  admin: {
    pages: [
      { path: "/carte", label: "Menus", icon: "menu" },
      { path: "/carte/restaurant", label: "Restaurant", icon: "store" },
      { path: "/carte/hours", label: "Hours", icon: "clock" },
      { path: "/carte/settings", label: "Settings", icon: "cog" },
    ],
  },
});
```

### `@carte/reservations` (standard)
```typescript
export default () => definePlugin({
  id: "carte-reservations",
  version: "0.1.0",
  capabilities: ["content:read", "content:write", "email:send"],
  hooks: {
    "content:afterSave": async (event, ctx) => {
      if (event.collection !== "carte_reservations") return;
      ctx.waitUntil(handleReservationSideEffects(ctx, event.content));
    },
  },
  routes: ["admin", "submit", "confirm", "cancel-by-token"],
  storage: {
    settings: {
      confirmationFromAddress: "noreply@example.com",
      defaultDurationMinutes: 90,
      reservationLeadHours: 2,
      reservationMaxAdvanceDays: 60,
      autoConfirm: false,            // false = pending → manual confirm
    },
  },
  admin: {
    pages: [
      { path: "/carte-reservations", label: "Reservations", icon: "calendar" },
      { path: "/carte-reservations/blocks", label: "Closures", icon: "x-circle" },
    ],
  },
});
```

### `@carte/orders-backend` (standard)
```typescript
export default () => definePlugin({
  id: "carte-orders-backend",
  version: "0.1.0",
  capabilities: ["content:read", "content:write", "email:send", "network:request"],
  allowedHosts: ["api.stripe.com", "checkout.stripe.com"],
  hooks: {
    "content:afterSave": async (event, ctx) => {
      if (event.collection !== "carte_orders") return;
      // Order created in DB by webhook handler; nothing else to do here
    },
  },
  routes: [
    "checkout",          // create Stripe Checkout session
    "webhook-stripe",    // receive Stripe webhook
    "refund",            // admin-authenticated refund
    "admin",             // Block Kit admin (basic ops; full UI in orders-admin)
  ],
  storage: {
    settings: {
      stripePublicKey: "",
      stripeSecretKey: "",         // marked secret in admin
      stripeWebhookSecret: "",
      currency: "USD",
      cartHoldTtlSeconds: 600,
      orderTypes: ["pickup", "delivery"],  // dine-in TBD v0.2
      pickupLeadMinutes: 20,
      deliveryLeadMinutes: 45,
    },
  },
});
```

### `@carte/orders-admin` (native)
```typescript
export default () => definePlugin({
  id: "carte-orders-admin",
  version: "0.1.0",
  capabilities: ["content:read", "content:write"],
  hooks: {},
  routes: ["modifier-update", "order-state-change"],  // called by React admin
  admin: {
    entry: "admin/index.js",
    pages: [
      { path: "/carte-orders", label: "Orders", icon: "shopping-bag" },
      { path: "/carte-orders/modifiers", label: "Modifiers", icon: "sliders" },
    ],
  },
});
```

### `@carte/ai` (native, paid)
```typescript
export default () => definePlugin({
  id: "carte-ai",
  version: "0.1.0",
  capabilities: ["content:read", "content:write", "network:request"],
  allowedHosts: [
    "api.anthropic.com",
    "api.openai.com",
    "generativelanguage.googleapis.com",
    "license.carteplugin.dev",   // license validation + trial tracking
  ],
  hooks: {},
  routes: ["chat-stream", "tool-call", "history", "license-check"],
  storage: {
    settings: {
      provider: "anthropic",
      model: "claude-opus-4-7",
      apiKey: "",                  // BYO LLM key
      licenseKey: "",
      autoApproveTools: [],        // user-configurable list of tools to skip confirm
    },
  },
  admin: {
    entry: "admin/index.js",
    pages: [{ path: "/carte-ai", label: "Chat", icon: "sparkles" }],
  },
});
```

---

## Data Model

### Collection: `carte_menu_items`
```ts
{
  id: string,                          // ulid
  slug: string,
  name: string,
  description: PortableTextBlock[],    // structured rich text
  shortDescription: string,            // for list views, search snippets
  price: { amount: number, currency: string },
  photo?: string,                      // media id
  section: string,                     // ref → carte_menu_sections
  menus: string[],                     // refs → carte_menus (item can be in multiple)
  dietary: string[],                   // ["vegan", "vegetarian", "gluten-free", "halal", "kosher"]
  allergens: string[],                 // EU 14 + US extensions
  modifiers?: ModifierGroup[],         // basic v0.1 — see Modifier shape below
  available: boolean,
  unavailableUntil?: ISO8601,          // for 86 with auto-restore (e.g., "tomorrow 6am")
  hidden: boolean,
  position: number,                    // sort within section
  x402Price?: { amount: number, currency: string },  // optional micropayment gate
  taxCategory?: string,                // for tax calc in orders
  // Future v0.2+: nutritionInfo, calorieCount, prepTimeMinutes
  createdAt: ISO8601,
  updatedAt: ISO8601,
}

type ModifierGroup = {
  id: string,
  name: string,                        // "Size", "Add-ons", "Cooking style"
  type: "single" | "multi",
  required: boolean,
  min?: number,                        // for multi: minimum selections
  max?: number,                        // for multi: maximum selections
  options: ModifierOption[],
}

type ModifierOption = {
  id: string,
  name: string,                        // "Medium", "Extra cheese"
  priceDelta: { amount: number, currency: string },  // can be 0 or negative
  default: boolean,
}
```

### Collection: `carte_menu_sections`
```ts
{
  id, slug, name,
  description?: string,
  parent?: string,                     // ref → carte_menu_sections (recursive)
  position: number,
  availableHours?: {                   // "Drinks section only after 5pm"
    days: string[],                    // ["mon", "tue", ...]
    timeRange: { start: "HH:MM", end: "HH:MM" },
  },
}
```

### Collection: `carte_menus`
```ts
{
  id, slug, name,                      // "Lunch Menu", "Dinner", "Wine List"
  description?: string,
  active: boolean,                     // master on/off
  schedule?: {                         // when this menu auto-displays
    days: string[],
    timeRange?: { start, end },
    dateRange?: { start, end },        // for seasonal menus
  },
  position: number,
  defaultMenu: boolean,                // shown when no others match schedule
}
```

### Collection: `carte_restaurant` (singleton for v0.1)
```ts
{
  id: "main",
  name: string,
  description: PortableTextBlock[],
  tagline?: string,
  address: {
    line1: string, line2?: string,
    city: string, region: string,
    postalCode: string, country: string,  // ISO 3166-1 alpha-2
  },
  geo?: { lat: number, lng: number },
  phone: string,
  email: string,
  website: string,
  cuisineTypes: string[],              // ["Italian", "Mediterranean"]
  priceRange: "$" | "$$" | "$$$" | "$$$$",
  hours: WeeklyHours,
  closures: Closure[],
  socialLinks: {
    instagram?, facebook?, x?, tiktok?, youtube?,
  },
  acceptsReservations: boolean,
  acceptsOrders: boolean,
  reservationLeadHours: number,        // min hours in advance
  reservationMaxAdvanceDays: number,
  photoGallery: string[],              // media ids
  featuredImage?: string,
  logo?: string,
  // Multi-location prep (v0.3 will add second location)
  isMultiLocation: false,
}

type WeeklyHours = {
  monday: DayHours,
  tuesday: DayHours,
  wednesday: DayHours,
  thursday: DayHours,
  friday: DayHours,
  saturday: DayHours,
  sunday: DayHours,
}

type DayHours = {
  closed: boolean,
  ranges: { open: "HH:MM", close: "HH:MM" }[],  // multiple ranges for split shifts
}

type Closure = {
  date: ISO8601,
  reason: string,                      // "Christmas", "Vacation", "Private event"
  partial?: { start: "HH:MM", end: "HH:MM" },  // null = whole day closed
}
```

### Collection: `carte_reservations`
```ts
{
  id,
  status: "pending" | "confirmed" | "seated" | "completed" | "no_show" | "cancelled",
  date: ISO8601,                       // YYYY-MM-DD
  time: "HH:MM",
  partySize: number,
  durationMinutes: number,             // default from settings (90)
  guest: {
    name: string,
    email: string,
    phone?: string,
    notes?: string,                    // dietary, occasion, etc.
  },
  source: "web" | "phone" | "ai" | "import",
  confirmationToken: string,           // for guest cancellation/modify link
  internalNotes?: string,              // staff-only
  seatedAt?: ISO8601,
  completedAt?: ISO8601,
  cancelledAt?: ISO8601,
  cancelReason?: string,
  createdAt, updatedAt, createdBy,
}
```

### Collection: `carte_reservation_blocks`
```ts
{
  id,
  date: ISO8601,
  timeRange?: { start: "HH:MM", end: "HH:MM" },  // null = whole day
  reason: string,                      // "Private event", "Holiday"
  capacityOverride?: number,           // partial block (e.g., reduce to 10 covers)
}
```

### Collection: `carte_orders`
```ts
{
  id,
  orderNumber: string,                 // human-readable, e.g., "C-2026-0142"
  status: "pending" | "paid" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled" | "refunded",
  type: "pickup" | "delivery",
  scheduledFor: ISO8601,               // pickup or delivery time
  customer: {
    name, email, phone,
    deliveryAddress?: Address,         // if delivery
  },
  items: OrderLineItem[],
  subtotal: Money,
  tax: Money,
  deliveryFee: Money,
  tip: Money,
  total: Money,
  paymentRef: string,                  // Stripe PaymentIntent id
  paymentProvider: "stripe",
  notes?: string,                      // customer note to kitchen
  internalNotes?: string,
  createdAt, updatedAt, paidAt, completedAt,
}

type OrderLineItem = {
  itemId: string,                      // ref → carte_menu_items
  itemName: string,                    // snapshotted at order time
  qty: number,
  unitPrice: Money,
  modifierSelections: {
    groupId: string,
    groupName: string,
    optionIds: string[],
    optionNames: string[],
    priceDelta: Money,
  }[],
  lineTotal: Money,
  notes?: string,
}
```

### KV Storage (plugin-scoped automatically)

| Plugin | Key pattern | Purpose | TTL |
|---|---|---|---|
| `@carte/core` | `menu-cache:{menuId}` | Pre-rendered menu fragment | 5 min |
| `@carte/core` | `hours-status` | Computed open/closed | 5 min |
| `@carte/core` | `schema-jsonld` | Generated JSON-LD blob | 30 min |
| `@carte/reservations` | `capacity:{date}:{slot}` | Atomic counter | none (permanent) |
| `@carte/reservations` | `hold:{holdId}` | 10-min reservation hold | 10 min |
| `@carte/orders-backend` | `cart-hold:{cartId}` | Cart inventory hold | 10 min |
| `@carte/orders-backend` | `idempotency:{stripeEventId}` | Webhook dedup | 7 days |
| `@carte/orders-backend` | `order-counter` | Order number sequence | none |
| `@carte/ai` | `chat:{userId}` | Chat history | 30 days |
| `@carte/ai` | `trial:{workspaceId}` | Trial start date | 30 days |
| `@carte/ai` | `license:{workspaceId}` | License validation cache | 24 hr |

---

## Hooks Used

### `@carte/core`
- `content:beforeSave` — validate menu item prices/allergens, validate hours format, validate WeeklyHours structure
- `content:afterSave` — invalidate menu cache, invalidate JSON-LD cache (via `ctx.waitUntil`)

### `@carte/reservations`
- `content:afterSave` — when a reservation is created/updated:
  - On `pending` (new): send "received" email to guest + notification email to restaurant
  - On `confirmed`: send confirmation email to guest with cancellation link
  - On `cancelled`: send cancellation email + restore capacity counter
  - All wrapped in `ctx.waitUntil`

### `@carte/orders-backend`
- `content:afterSave` — order state transitions trigger emails:
  - On `paid`: receipt + kitchen notification
  - On `ready`: "your order is ready" SMS-equivalent email (or push if PWA)
  - On `out_for_delivery`: tracking notification
  - On `cancelled` / `refunded`: notification
  - All in `ctx.waitUntil`
- Stripe webhook handled in route, not hooks

---

## Routes

All mount at `/_emdash/api/plugins/<plugin-id>/<route>`.

### `@carte/core`
- `GET .../menu-feed?menuId=...` — JSON menu (cached at edge)
- `GET .../schema-jsonld` — full Restaurant + Menu JSON-LD (cached)
- `POST .../admin/...` — Block Kit admin pages

### `@carte/reservations`
- `POST .../submit` — public reservation submission (rate-limited per IP via KV)
- `GET .../confirm?token=...` — guest confirmation link (when `autoConfirm: false`)
- `GET .../cancel-by-token?token=...` — guest cancellation link
- `POST .../admin/...` — Block Kit admin

### `@carte/orders-backend`
- `POST .../checkout` — create Stripe Checkout session, return URL
- `POST .../webhook-stripe` — Stripe webhook receiver (verifies signature, idempotent)
- `POST .../refund` — admin-authenticated refund
- `POST .../admin/...` — Block Kit fallback admin (for sandboxed-only environments)

### `@carte/orders-admin` (native)
- React admin entry; calls REST routes for modifier ops, state changes

### `@carte/ai` (native)
- `POST .../chat-stream` — proxies to declared LLM provider (SSE)
- `POST .../tool-call` — executes Carte op after user confirmation
- `GET .../history` — chat history for current user
- `POST .../license-check` — verify license / trial status against `license.carteplugin.dev`

---

## Frontend Integration (`@carte/views`)

Astro components, peer-dep npm package installed in the user's EmDash project (not via marketplace).

```astro
---
import { getEmDashCollection } from "emdash";
import {
  RestaurantHero,
  MenuDisplay,
  HoursWidget,
  ReservationForm,
  OrderingCart,
} from "@carte/views";

const { entry: restaurant } = await getEmDashCollection("carte_restaurant", { id: "main" });
const { entries: menus } = await getEmDashCollection("carte_menus", {
  filter: { active: true },
  sort: { position: "asc" },
});
---

<RestaurantHero restaurant={restaurant} />
<HoursWidget hours={restaurant.hours} closures={restaurant.closures} />

{menus.map(menu => <MenuDisplay menuId={menu.id} />)}

<ReservationForm restaurantId="main" />
<OrderingCart restaurantId="main" />
```

Components:
- `<RestaurantHero>` — name, tagline, hero image, key info
- `<MenuDisplay>` — full menu rendering (sections + items)
- `<MenuSection>`, `<MenuItem>` — composable
- `<HoursWidget>` — current open/closed status, "opens at X" copy
- `<ReservationForm>` — booking widget (date/time/party/contact)
- `<OrderingCart>` — modal cart with modifier selection
- `<OrderingCheckout>` — checkout flow page (handles Stripe redirect)
- `<RestaurantInfo>` — combined hours + location + contact card
- `<DietaryFilter>` — filter menu by dietary tag

Tailwind by default; headless variants for theme customization.

### Live Collections (Astro pattern)
```ts
// src/live.config.ts
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
  menuItems: defineLiveCollection({
    loader: emdashLoader({ collection: "carte_menu_items" }),
  }),
  menus: defineLiveCollection({
    loader: emdashLoader({ collection: "carte_menus" }),
  }),
};
```

---

## Critical Technical Designs

### Reservation hold pattern (race-safe)

Standard EmDash race-safe pattern using KV atomic counters and TTL holds:

```
1. Guest submits booking → POST /reservations/submit
2. Backend (sandboxed):
   a. Validate slot availability (compute from hours - blocks)
   b. Atomically decrement KV capacity:{date}:{slot} by 1
      → if would go negative, reject as "Fully booked"
   c. Write KV hold:{holdId} = { reservation, expiresAt: now+10min, ttl: 600s }
   d. Create reservation in DB with status="pending"
   e. ctx.waitUntil(sendPendingEmail + sendStaffNotification)
   f. Return 200 with confirmation token
3a. If autoConfirm=true: backend immediately transitions to confirmed
3b. If autoConfirm=false: staff manually confirms in admin
4. On hold expiry (no manual confirm within window): cancel reservation, restore capacity
```

### Order checkout pattern (race-safe + Stripe-integrated)

```
1. Customer submits cart → POST /orders/checkout
2. Backend:
   a. Validate items still available (read carte_menu_items, check available flag)
   b. For each line, no inventory decrement (orders aren't capacity-limited like seats)
      EXCEPT for items with limited daily quantity (advanced; v0.2)
   c. Compute totals: subtotal + tax + delivery fee + tip
   d. Write KV cart-hold:{cartId} = { items, expiresAt: now+10min }
   e. Create Stripe Checkout session with:
      - line_items from cart
      - metadata: { cartId, scheduledFor, type, customerEmail }
      - success_url + cancel_url
   f. Return checkout URL
3. Customer pays via Stripe Checkout
4. Stripe webhook → POST /webhook-stripe
   a. Verify signature (HMAC; <1ms)
   b. Check KV idempotency:{eventId} — if exists, return 200 immediately
   c. Set idempotency key (TTL 7 days)
   d. ctx.waitUntil(promote-cart-to-order(cartId, paymentIntent))
   e. Return 200
5. waitUntil work:
   a. Read cart hold from KV
   b. Create carte_orders entry (status="paid")
   c. Generate order number from KV counter
   d. Send receipt email + kitchen notification email
   e. Delete cart hold
```

**Subrequest budget for webhook:** signature verify (~1) + KV ops (~3) + content create (~1) + email send (~2) = 7 of 10. Within budget.

**Why Stripe Checkout vs Payment Intent:** Per [Stripe's comparison](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison), Checkout handles tax, line items, mobile UX, and PCI compliance for us. Payment Intent would require building the entire checkout UI ourselves — not worth it for restaurants. Use Checkout for v0.1; consider embedded Payment Element for v0.2 if branded checkout matters.

### Time-slot generation (read-time computation)

No persisted slots — eliminates stale-data bugs entirely. On any reservation form load:

```
slots = []
for each 30-min slot in restaurant hours for selected date:
  if reservation_block covers this slot:
    if capacityOverride: capacity = capacityOverride
    else: skip slot
  else:
    capacity = settings.defaultSlotCapacity
  
  current_bookings = KV.get(`capacity:${date}:${slot}`) ?? 0
  remaining = capacity - current_bookings
  
  if remaining > 0:
    slots.push({ time, remaining, fits: remaining >= partySize })

return slots
```

Fast, correct, edge-cacheable per (date, partySize).

### Menu rendering performance

- Per-menu KV cache, invalidated on `content:afterSave` for any item in that menu
- Target: <5 D1 queries cold, <50ms cold, <10ms warm
- Edge-cached 5 minutes
- Schema.org JSON-LD pre-generated, cached 30 minutes

### 86 button auto-restore

When admin (or AI) marks an item 86:
- `available: false`, `unavailableUntil: <next 6am local time>` (or user-specified)
- A periodic check (next read of menu) sees `unavailableUntil < now` → auto-restore to `available: true`
- Avoids needing scheduled cron entirely (uses lazy restore on read)

### Schema.org JSON-LD generation

Auto-generated from structured menu data. Per [schema.org/MenuSection](https://schema.org/MenuSection), structure is recursive:

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Restaurant Name",
  "address": { "@type": "PostalAddress", ... },
  "telephone": "...",
  "servesCuisine": ["Italian"],
  "priceRange": "$$",
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday"], "opens": "11:00", "closes": "22:00" }
  ],
  "acceptsReservations": true,
  "hasMenu": [{
    "@type": "Menu",
    "name": "Dinner Menu",
    "hasMenuSection": [{
      "@type": "MenuSection",
      "name": "Mains",
      "hasMenuItem": [{
        "@type": "MenuItem",
        "name": "Grilled Salmon",
        "description": "...",
        "suitableForDiet": ["https://schema.org/GlutenFreeDiet"],
        "offers": { "@type": "Offer", "price": "28.00", "priceCurrency": "USD" }
      }]
    }]
  }]
}
```

Critical for Google rich results, Google Maps integration, and AI agent ingestion.

### Allergen tagging

Carte ships with the **EU FIC 14 mandatory allergens** (cereals containing gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs) plus common US-extended additions (corn, sesame, etc.). Restaurant can extend the tag set. AI assist: "tag all items with allergens based on description" (one click).

### Multi-location prep (data model only in v0.1)

Even though v0.1 ships single-location, the data model is multi-location-ready:
- `carte_restaurant` has `isMultiLocation: false` flag
- `carte_locations` collection exists but is empty/single-record in v0.1
- All collections (`carte_menu_items`, `carte_reservations`, `carte_orders`) optionally reference `locationId`, defaulting to "main"
- v0.3 adds `@carte/multi-location` plugin: location switcher in admin, per-location menus/hours/orders

This means v0.3 doesn't require a data migration — multi-location is purely a UI + scoping layer added on top.

### x402 micropayment integration

EmDash core handles x402. Carte contributes:
- Optional `x402Price` on menu items — used for premium/limited-edition items where AI agents might purchase content (e.g., "AI-purchasable cookbook recipes," "agent-accessible wine list with pairing notes")
- Optional `x402Price` on `carte_restaurant.description` for premium restaurant listings
- Niche use case in v0.1 (most restaurants won't use it), but it's a 30-line feature that costs nothing and demonstrates EmDash uniqueness

---

## AI Layer (`@carte/ai`)

### Surface 1: Operations as MCP tools

EmDash 0.9.0 does not expose a public custom MCP tool registration API yet (upstream feature request: `github.com/emdash-cms/emdash/discussions/850`). Carte v0.1 therefore ships an interim integration:

- Plugin routes mounted at `/_emdash/api/plugins/<plugin-id>/<route>` for every AI-facing write or query surface.
- A standalone MCP wrapper Worker, installed by the operator into their MCP client, that proxies MCP tool calls to those plugin routes.
- When EmDash ships first-class custom MCP tool registration, Carte migrates the wrapper to the native API and removes the proxy layer in a follow-up release.

Tools to expose:

```
menu.items.list({ menuId?, section?, hidden?: bool })
menu.items.get(idOrSlug)
menu.items.create(itemDraft)
menu.items.update(id, patch)
menu.items.delete(id)
menu.items.86(id, untilTime?: ISO8601)              // auto-restore time defaults to next 6am
menu.items.unlist(id)                                 // hidden=true (different from 86)
menu.items.swap(outId, inId)                          // out goes 86, in becomes available
menu.items.set_price(id, newPrice)
menu.items.set_dietary(id, tags[])
menu.items.set_allergens(id, tags[])
menu.items.add_modifier(id, group)

menu.sections.list(menuId)
menu.sections.create(menuId, sectionDraft)
menu.sections.update(id, patch)
menu.sections.reorder(menuId, newOrder)

menus.list()
menus.create(menuDraft)
menus.set_active(menuId, schedule?)
menus.deactivate(menuId)

specials.set({ date, items })
specials.clear({ date })

hours.get()
hours.set({ day, ranges })
hours.close({ date, reason, partial?: { start, end } })
hours.reopen({ date })

reservations.today()
reservations.week()
reservations.list({ status?, dateRange? })
reservations.confirm(id) / cancel(id) / mark_seated(id) / mark_no_show(id) / mark_completed(id)
reservations.move({ id, newDate, newTime })
reservations.block({ date, range, reason, capacityOverride? })
reservations.unblock(blockId)

orders.today()
orders.list({ status?, dateRange? })
orders.update_status(id, newStatus)
orders.refund(id, options?)
orders.add_internal_note(id, note)

restaurant.info.update(patch)
restaurant.info.update_socials(socials)
```

Each tool has JSON Schema + examples + natural-language description for the LLM to call correctly.

### Surface 2: In-admin AI chat panel (native React)

Persistent panel in EmDash admin (when `@carte/ai` installed):

- BYO API key per workspace (Anthropic / OpenAI / Gemini)
- Calls go through `network:request` to declared LLM hostnames
- Chat history in plugin KV scoped per user, 30-day retention
- All write actions show diff preview + confirm UI
- Per-tool "auto-approve" flag for trusted users
- License/trial validation cached 24hr

**Example transcripts:**

> User: 86 the lamb shank, we're out
>
> Carte AI: "Lamb Shank with Mint Jus" will be marked unavailable until tomorrow 6am.
>
> [Confirm] [Cancel]

> User: bump the wagyu to $52 and the truffle pasta to $34
>
> Carte AI: Two price changes ready:
> - Wagyu Strip Loin: $48 → **$52**
> - Truffle Pasta: $28 → **$34**
>
> [Confirm both] [Confirm one] [Cancel]

> User: block tuesday for a private event, we're closed all day
>
> Carte AI: Tuesday Nov 4 will be marked closed (private event).
> - 0 reservations on file for that day, no cancellations needed.
> - Online ordering will be disabled for that day.
>
> [Confirm] [Cancel]

> User: swap the risotto for a new dish — lamb shank, $38, on the dinner menu in the mains section
>
> Carte AI: Two changes ready:
> 1. **86 "Mushroom Risotto"** indefinitely (mark hidden)
> 2. **Create "Lamb Shank"** — $38, Dinner > Mains
>    - Description needed. Want me to generate one?
>
> [Confirm both] [Generate description first] [Cancel]

> User: my friday lunch was packed, what time slots filled up?
>
> Carte AI: Friday Apr 24 lunch service:
> - 11:30am: 8/12 covers (66%)
> - 12:00pm: 12/12 covers (100% — full)
> - 12:30pm: 12/12 covers (100% — full)
> - 1:00pm: 11/12 covers (92%)
> - 1:30pm: 6/12 covers (50%)
>
> Suggestion: extend lunch service or add capacity at 12-1pm slots.

### Surface 3: Inline AI actions

Per-field "✨ AI" buttons in the editor:
- Menu item description: "Generate from name and ingredients"
- Photo alt text: auto-generated from menu item context
- Allergen tagging: "Tag this item with allergens based on description"
- Translate menu (when EmDash i18n active)
- Email template: "Write a polite cancellation email to a no-show"

### Trust model (non-negotiable)

- **Read-by-default, write-on-confirm**
- **Diff preview** before any update
- **Audit log** of every AI action (uses EmDash's first-party audit log if installed)
- **Reversible writes** — every destructive action returns an undo token (10-min validity)
- **PII protection** — guest names/emails never sent to LLM unless user explicitly confirms
- **Rate & spend caps** per workspace

### Trial & licensing

- 14-day free trial starts on first chat interaction
- Trial state in KV: `trial:{workspaceId} = { startedAt: ISO8601 }`
- License check on every chat turn (cached 24hr): hit `license.carteplugin.dev/check?key={licenseKey}&workspace={id}`
- Expired trial without license: chat panel shows "Subscribe to continue" CTA, MCP tools and inline actions still work for read operations only
- License revoked: graceful degradation to read-only

---

## External Dependencies

| Plugin | External services | `allowedHosts` |
|---|---|---|
| `@carte/core` | none | (none) |
| `@carte/reservations` | core mail pipeline | (uses `email:send`) |
| `@carte/orders-backend` | Stripe | `api.stripe.com`, `checkout.stripe.com` |
| `@carte/ai` | LLM provider + license server | `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, `license.carteplugin.dev` |

---

## Security Considerations

What Carte plugins cannot do, by design:
- No filesystem access
- No raw SQL
- No reaching arbitrary network hosts (only `allowedHosts`)
- No reading other plugins' KV
- No executing system commands
- No injecting arbitrary HTML/JS into admin (Block Kit JSON only, for sandboxed)
- No bypassing admin auth

Plugin-to-plugin isolation: a vulnerability in `@carte/ai` (talks to LLMs) cannot exfiltrate Stripe data from `@carte/orders-backend`. Different V8 isolates with different capability bindings.

**Native-format plugins** (`@carte/orders-admin`, `@carte/ai`) are NOT sandboxed. They're trusted code, installed with explicit trust grant. We document this clearly at install time.

**On Cloudflare Free plan:** Dynamic Workers are unavailable, so Cloudflare Free cannot host sandboxed plugins at all (`emdash` Issue #149). Standard plugins therefore run trusted instead, and Carte's install flow and marketing must surface that loss of isolation before operators choose a free-plan deployment.

**PCI compliance:** Stripe Checkout handles all card data. Card details never touch our infrastructure. PCI scope minimized to "we accept Stripe webhooks."

---

## Content Model Impact

- Menu item descriptions use Portable Text (same as core EmDash)
- Custom Portable Text blocks (require native format):
  - `carte:menu-item-card` (embed an item inline in another article)
  - `carte:reservation-cta`
  - `carte:hours-block`
- These register via `admin.portableTextBlocks` in native plugin manifests
- EmDash FTS5 search indexes menu item name, description, dietary, allergens, restaurant info
- i18n: menus translate per EmDash's built-in i18n; modifier names translate at the option level

---

## Competitive Analysis

| Plugin | Installs | Strengths | Weaknesses (vs Carte) |
|---|---|---|---|
| **WPCafe** | 30K+ | Visual table layout, complete cafe UX | No isolation, no AI, slow on large menus |
| **FoodMaster** | 10K+ restaurants | Most complete (POS, KDS, multi-location) | Heavy footprint, $499/yr, no AI |
| **Orderable** | 10K+ | Best mobile checkout | No reservations, no menu builder for non-WC sites |
| **GloriaFood** | Multi-million restaurants | Free, fast setup | Proprietary widget, no real customization, no AI |
| **RestroFood** | 4K+ restaurants | All-in-one with add-ons | Newer, smaller community |
| **Five Star Restaurant Reservations** | Most-installed reservations | Free, simple | Reservations only, no menu/orders |
| **Toast / Square POS** | Industry standard | Full restaurant ops | Not a website plugin; proprietary; expensive |

**Carte's positioning:** *"FoodMaster's depth, Orderable's mobile UX, with native AI workflow and Cloudflare-edge speed."*

Out of scope for v0.1:
- Multi-location chains (5+ locations)
- POS replacement (most restaurants keep Toast/Square)
- KDS (kitchen display)
- White-label / SaaS multi-tenant restaurant platforms

---

## Roadmap

### v0.1 — Public preview + your live client (12 weeks)

- `@carte/core` — menus, items, sections, restaurant info, hours, schema.org, Block Kit admin
- `@carte/reservations` — booking form, time-slot logic, capacity, email confirmations
- `@carte/orders-backend` (sandboxed) — Stripe Checkout, webhook handling, order state
- `@carte/orders-admin` (native) — React order management, modifier editor
- `@carte/views` (npm) — Astro components for theme integration
- `@carte/ai` (native, paid + trial) — chat panel + MCP tools + inline AI

**12-week breakdown:**
- Weeks 1-2: `@carte/core` (menus, items, hours, restaurant info, Block Kit admin)
- Weeks 3-4: `@carte/views` (Astro components, theme integration with client site)
- Weeks 5-6: `@carte/reservations` (booking flow, capacity, emails)
- Weeks 7-9: `@carte/orders-backend` + `@carte/orders-admin` (Stripe, webhook, modifier UI)
- Weeks 10-11: `@carte/ai` (chat panel, MCP tools)
- Week 12: Hardening, schema.org validation, client launch

### v0.2 — Operations & UX (8 weeks after v0.1)
- `@carte/floor-plan` (native) — visual table layout for reservations
- Limited-quantity inventory (e.g., "only 12 of these per day")
- Embedded Payment Element option (vs hosted Checkout)
- Order status PWA for kitchen ("orders ready in 5 min")
- Advanced modifier engine (build-your-own combinatorics)

### v0.3 — Multi-location (8 weeks after v0.2)
- `@carte/multi-location` — location switcher, per-location menus/hours/orders
- `@carte/delivery` — delivery zones, fees, time slots
- QR table ordering
- POS integration (read-only sync from Toast/Square — menus, not orders)

### v1.0 — Stable (3 months after v0.3)
- Hardening, security audit, full docs site, ecosystem launch
- Showcase: 3+ production restaurants

---

## Success Metrics

**v0.1 (3 months):**
- Your live restaurant client launches successfully
- 50 EmDash sites with `@carte/core` installed
- 10 paying customers on `@carte/ai` after trials convert
- Schema.org validation passes Google's Rich Results Test for Restaurant + Menu
- All sandboxed handlers within the 50ms CPU / 10 subrequest / 30s wall / ~128MB sandbox budget
- AI chat panel handles 86 / price update / block date / move reservation end-to-end

**v1.0 (12 months):**
- 1,000 EmDash sites with `@carte/core`
- 200 paying customers on `@carte/ai`
- $100K ARR
- 4.5+ avg rating in EmDash plugin marketplace
- 3+ showcase restaurants in production

---

## Open Questions

1. **RESOLVED — Capability naming source of truth** — Carte standardizes on `content:read`, `content:write`, `media:read`, `media:write`, and `network:request`, following `github.com/emdash-cms/emdash/blob/main/skills/creating-plugins/SKILL.md`. All manifest examples and capability references in this PRD use those canonical resource:verb names.
2. **RESOLVED — Custom MCP tool registration API** — EmDash 0.9.0 has no public plugin-defined MCP tool registration API yet (`github.com/emdash-cms/emdash/discussions/850`). Carte v0.1 ships plugin routes at `/_emdash/api/plugins/<id>/<route>` plus a standalone MCP wrapper Worker; see §"AI Layer" → "Surface 1: Operations as MCP tools".
3. **Order-tracking notifications** — email is in v0.1. SMS/push needs a third-party (Twilio?) or PWA push API. Defer to v0.2.
4. **Tax calculation** — Stripe Tax (built into Checkout) for US sales tax; manual override for VAT countries. Document the limit clearly: Carte does NOT do international tax. Use Stripe Tax or manual.
5. **Free trial enforcement model** — local check (KV-based) is bypassable. Server-side check via license.carteplugin.dev is reliable but adds dependency. Recommend **server-side check with 24hr cache**, gracefully degrade if license server unreachable (not block the restaurant from running).
6. **GDPR / right-to-erasure** — Required from day one for guest data (reservations, orders). Ship export + erasure handlers in v0.1.
7. **Plugin name "Carte" final lock** — verified clear in WP/CMS plugin space; confirm with developer.
8. **Stripe Connect for v0.3 multi-location** — when shipping multi-location, do we use Stripe Connect (each location = separate Stripe account) or single account with metadata-based separation? Single account is simpler; Connect is correct for multi-owner. Defer decision to v0.3 design phase.
9. **Photo handling** — menu photos go through EmDash media library + Cloudflare Images? Or just media library? Recommend leverage **Cloudflare Images when available** for auto WebP/AVIF + responsive variants; fall back to media library otherwise.
10. **Rate limiting on public reservation/order endpoints** — implement KV-based rate limit per IP; configurable by restaurant. Critical anti-spam.
11. **Modifier complexity ceiling for v0.1** — current spec supports single-tier modifier groups (Size, Add-ons). NOT supporting nested modifiers ("if you choose pizza, then choose toppings, then choose crust"). Confirm acceptable for v0.1 scope.
12. **Cancellation policy enforcement** — restaurant sets cancellation policy in settings ("free up to 24hr before, $X fee after"). Stripe charge for late cancellation = adds complexity. Defer to v0.2; v0.1 just records cancellation, no charge.

---

## Definition of Done (v0.1)

- All 6 plugins shipping (4 sandboxed, 2 native)
- Your live restaurant client launched on Carte
- Schema.org validation passes Google Rich Results Test
- AI chat panel handles all common menu/reservation/order operations
- Stripe Checkout integration end-to-end with idempotent webhook handling
- All sandboxed handlers verified within the 50ms CPU / 10 subrequest / 30s wall / ~128MB sandbox limits
- Public docs site with quickstart and recipe library
- 1+ showcase restaurant beyond your client
