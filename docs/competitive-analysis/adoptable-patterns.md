## Cross-plugin patterns to highlight first

- **All three plugins compute availability at read time from mutable business state rather than publishing static storefront snapshots.** LatePoint renders the datepicker from a live booking request and timezone session (`research/sources/carte/latepoint/lib/views/steps/_booking__datepicker.php:24`), Orderable counts remaining orders per time slot on demand (`research/sources/carte/orderable-pro/inc/modules/timings-pro/class-timings-pro.php:136`), and RestroFood generates pickup/delivery slots from the current day schedule and branch context (`research/sources/carte/restrofood/inc/class-date-time-map.php:56`).
- **All three plugins converge on small operator shells with denser task-specific work areas.** LatePoint’s day calendar renders stacked slot boxes inside one schedule view (`research/sources/carte/latepoint/lib/views/events/events_day_view.php:89`), Orderable reshapes checkout around one mobile summary + one form column (`research/sources/carte/orderable-pro/woocommerce/checkout/form-checkout.php:37`), and RestroFood keeps one top-level menu while pushing complexity into specific pages and tabs (`research/sources/carte/restrofood/admin/inc/class-admin-menu.php:38`).
- **Two of the three plugins bolt secondary channels and extension surfaces onto the core flow instead of making them foundational.** LatePoint keeps notification authoring in a dedicated email settings/editor surface (`research/sources/carte/latepoint/lib/views/settings/notifications.php:72`), and Orderable exposes SMS/WhatsApp as optional branches off its email-first status notification UI (`research/sources/carte/orderable-pro/inc/modules/custom-order-status-pro/templates/admin/notifications-metabox.php:68`).

## Pattern 1: Read-time schedule computation with bounded capacity
**Tag:** MUST-ADOPT
**Source:** `research/sources/carte/latepoint/lib/views/steps/_booking__datepicker.php:24`, `research/sources/carte/orderable-pro/inc/modules/timings-pro/class-timings-pro.php:136`, `research/sources/carte/restrofood/inc/class-date-time-map.php:56`
**Carte target:** `packages/reservations/src/availability/read-time-slots.ts` and `packages/orders-backend/src/fulfillment/read-time-slots.ts`
**Linear:** `PRO-476`

All three products compute availability from live inputs at request time: booking request + timezone in LatePoint, timestamp + order counts in Orderable, and day/branch schedule data in RestroFood. Carte should adopt the read-time computation pattern across reservations and pickup/delivery windows, but keep the PRD divergence that slots are derived instead of persisted rows. Capacity must be enforced by bounded counters and not by pre-generated slot records.

## Pattern 2: Mobile-first checkout with explicit summary toggle
**Tag:** MUST-ADOPT
**Source:** `research/sources/carte/orderable-pro/woocommerce/checkout/form-checkout.php:37`
**Carte target:** `packages/views/src/components/checkout/mobile-checkout-shell.astro` and `packages/orders-admin/src/routes/checkout-preview.tsx`
**Linear:** `PRO-471`

Orderable’s checkout promotes a mobile header that always exposes the running total and lets the user reveal or collapse the order summary without leaving the form. Carte should preserve that interaction model in Astro storefront components so phones can complete checkout with one-thumb navigation and minimal scrolling friction. The structure should be native to Carte rather than inherited from Woo templates.

## Pattern 3: Single-tier modifier groups with per-option fee metadata
**Tag:** MUST-ADOPT
**Source:** `research/sources/carte/orderable-pro/inc/modules/addons-pro/class-addons-pro-field-groups.php:50`, `research/sources/carte/orderable-pro/inc/modules/addons-pro/class-addons-pro-fields.php:274`
**Carte target:** `packages/orders-admin/src/modifiers/modifier-group-form.tsx` and `packages/views/src/components/menu-item/modifier-group.astro`
**Linear:** `PRO-473`

Orderable models add-ons as one custom post type with a direct field/options payload, and each rendered option carries its own price delta and selection rules. Carte should adopt that single-tier grouping concept for v0.1 because it matches the PRD data model and avoids nested modifier complexity. The UI should support min/max group rules and option-level fee adjustments, but not recursive group trees.

## Pattern 4: Shared order/reservation state should be explicit content, not ambient globals
**Tag:** MUST-ADOPT
**Source:** `research/sources/carte/restrofood/inc/class-woo-hooks.php:137`, `research/sources/carte/restrofood/frontend-admin/template-admin-components.php:549`, `research/sources/carte/latepoint/lib/views/steps/partials/_booking_summary.php:46`
**Carte target:** `packages/orders-backend/src/content/order-record.ts` and `packages/reservations/src/content/reservation-record.ts`
**Linear:** `PRO-470`

RestroFood and LatePoint both show that downstream operator views depend on stable order/booking metadata like branch, fulfillment time, customer, and manage-link identifiers. Carte should adopt the idea of one durable record per order/reservation that every UI surface reads, but encode it in typed `ctx.content` collections instead of Woo meta or PHP globals. This keeps cross-package coordination explicit while still giving operators one coherent operational picture.

## Pattern 5: Compact top-level admin IA with focused sub-pages
**Tag:** SHOULD-ADOPT
**Source:** `research/sources/carte/restrofood/admin/inc/class-admin-menu.php:38`, `research/sources/carte/latepoint/lib/views/bookings/index.php:66`
**Carte target:** `packages/core/src/admin/navigation.ts` and `packages/orders-admin/src/admin/navigation.ts`
**Linear:** `PRO-472`

RestroFood proves that restaurants do not need a sprawling sidebar if the high-frequency workflows are reachable from a few focused destinations, while LatePoint shows the value of dense list/calendar views within those destinations. Carte should keep the planned small admin nav surface and make each page task-centric rather than settings-centric. The adoption is about information architecture, not copying wp-admin layout primitives.

## Pattern 6: Status-driven operator workflows and notifications
**Tag:** SHOULD-ADOPT
**Source:** `research/sources/carte/orderable-pro/inc/modules/custom-order-status-pro/class-custom-order-status-pro.php:45`, `research/sources/carte/latepoint/lib/views/orders/quick_edit.php:51`
**Carte target:** `packages/orders-backend/src/orders/status-machine.ts` and `packages/orders-admin/src/routes/order-detail.tsx`
**Linear:** `PRO-474`

Orderable centers admin actions and downstream notifications on explicit order status transitions, and LatePoint mirrors the same concept with editable order and fulfillment states in one operator form. Carte should adopt a first-class status machine for orders and reservations so receipts, kitchen transitions, and audit logs hang off deterministic state changes. This also gives Milestone 1 a clean place to lock email-only notifications in v0.1.

## Pattern 7: Notification templating stays email-first in v0.1
**Tag:** SHOULD-ADOPT
**Source:** `research/sources/carte/latepoint/lib/views/settings/notifications.php:72`, `research/sources/carte/orderable-pro/inc/modules/custom-order-status-pro/templates/admin/notifications-metabox.php:68`
**Carte target:** `packages/reservations/src/notifications/email-templates.ts` and `packages/orders-backend/src/notifications/email-templates.ts`
**Linear:** `PRO-475`

LatePoint invests in editable email templates and variables, while Orderable treats SMS and WhatsApp as optional expansions attached to the same event model. Carte should adopt the email-first posture for v0.1 and design template data contracts so extra channels can be added later without reworking trigger semantics. This aligns with the PRD’s likely OQ outcome around notifications and avoids overcommitting sandbox subrequest budgets.

## Pattern 8: Theme replacement should become a stable storefront shell, not template override sprawl
**Tag:** INVESTIGATE
**Source:** `research/sources/carte/orderable-pro/inc/modules/checkout-pro/class-checkout-pro-override-checkout.php:44`, `research/sources/carte/restrofood/inc/class-hooks.php:144`
**Carte target:** `packages/views/src/layouts/restaurant-shell.astro`
**Linear:** `PRO-412`

Orderable and RestroFood both take over core storefront pages by swapping in their own templates, which is effective but tightly coupled to WordPress theme assumptions. Carte should investigate the underlying lesson—own the full restaurant shell for critical workflows—while implementing it as Astro layouts and plugin routes rather than runtime template hijacks. The pattern is promising, but the exact surface area needs design work before adoption.

## Pattern 9: Cross-plugin operator summaries need dense visual time views
**Tag:** INVESTIGATE
**Source:** `research/sources/carte/latepoint/lib/views/events/events_day_view.php:89`, `research/sources/carte/restrofood/frontend-admin/template-admin-components.php:111`
**Carte target:** `packages/orders-admin/src/routes/ops-board.tsx` and `packages/reservations/src/admin/day-view.ts`
**Linear:** `PRO-409`

LatePoint’s day schedule and RestroFood’s dashboard cards both reveal the same operator need: glanceable time-oriented boards outperform raw tables during service. Carte should investigate a shared operational board concept spanning bookings and order readiness, especially once multiple same-hour flows coexist. This may belong in v0.2 if the first pass can ship with simpler lists and filters.

## Pattern 10: Persisted slot rows are the wrong abstraction for Carte
**Tag:** EXPLICITLY-REJECT
**Source:** `research/sources/carte/latepoint/lib/views/bookings/grouped_bookings_quick_view.php:23`, `research/sources/carte/orderable-pro/inc/modules/timings-pro/class-timings-pro-checkout.php:140`, `research/sources/carte/restrofood/inc/class-date-time-map.php:63`
**Carte target:** `packages/reservations/src/availability/read-time-slots.ts`
**Linear:** `PRO-414`

LatePoint, Orderable, and RestroFood all rely on stored booking/order state to decide whether a concrete slot can still be shown or claimed, but the PRD already rejects the WordPress habit of treating slots as primary persisted entities. Carte should explicitly reject any implementation that materializes timeslot rows as the source of truth. Instead, order and reservation records are the durable state, and slots are read-time projections over that state.

## Pattern 11: Ambient transients and option blobs are an architectural trap
**Tag:** EXPLICITLY-REJECT
**Source:** `research/sources/carte/restrofood/inc/class-components-ajax.php:1318`, `research/sources/carte/restrofood/inc/helper-functions.php:1140`, `research/sources/carte/latepoint/latepoint.php:41`
**Carte target:** `packages/core/src/settings/restaurant-settings.ts` and `packages/orders-backend/src/context/request-context.ts`
**Linear:** `PRO-409`

RestroFood stores branch and availability context in transients that unrelated flows later assume are present, and LatePoint seeds process-wide globals very early in bootstrap. Carte should explicitly reject ambient shared state in favor of typed request context and explicit `ctx.content` / `ctx.storage` boundaries. That keeps package composition predictable and avoids the plugin-sprawl failure mode the PRD is trying to escape.
