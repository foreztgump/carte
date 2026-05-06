## Chronic WordPress restaurant problems we will not inherit

### 1. Plugin sprawl is real, and each product solves only a slice of restaurant operations

LatePoint focuses on booking and appointment operations, not menus or online ordering: the plugin boots a bookings-first router and admin surface, and its settings literally expose booking-specific slot restrictions, buffers, and notifications rather than a broader restaurant domain (`research/sources/carte/latepoint/latepoint.php:923`, `research/sources/carte/latepoint/lib/views/settings/general.php:213`).

Orderable Pro is explicitly a WooCommerce extension for checkout, time slots, add-ons, and custom order statuses rather than a full restaurant system; even its plugin header describes it as a “Pro extension” and the codebase centers on checkout, timings, and order-state modules (`research/sources/carte/orderable-pro/orderable-pro.php:4`, `research/sources/carte/orderable-pro/orderable-pro.php:18`).

RestroFood gets closer to an all-in-one product, but it still depends on WooCommerce and spreads its experience across one plugin bootstrap, page-template swaps, and Woo order meta rather than a coherent platform boundary (`research/sources/carte/restrofood/restrofood.php:78`, `research/sources/carte/restrofood/inc/class-hooks.php:27`, `research/sources/carte/restrofood/inc/class-woo-hooks.php:137`).

**Instead, we will…** ship menus, reservations, and orders as one versioned Carte family with explicit package contracts instead of forcing operators to assemble unrelated plugins around WooCommerce or a booking silo.

### 2. Update anxiety comes from giant mutable plugins with broad runtime blast radius

LatePoint multiplexes public and authenticated traffic through one generic `latepoint_route_call` action, so a routing bug or regression hits nearly every booking path at once (`research/sources/carte/latepoint/latepoint.php:923`).

RestroFood loads menu browsing, location checks, ordering flows, operator dashboards, widgets, and settings in one include graph, which means a change in one domain can destabilize many others during service hours (`research/sources/carte/restrofood/restrofood-init.php:10`, `research/sources/carte/restrofood/restrofood-init.php:36`).

RestroFood’s bundled base class also directly resets update transients and injects plugin-update responses, showing how deeply the plugin hooks itself into WordPress update machinery (`research/sources/carte/restrofood/restrofoodBase.php:28`, `research/sources/carte/restrofood/restrofoodBase.php:192`).

**Instead, we will…** isolate responsibility by plugin package and sandboxed route boundary so a failure in one Carte surface cannot mutate unrelated runtime/update state or take down the whole restaurant stack.

### 3. AI is absent or bolted on; operators are still driven through forms, tabs, and AJAX endpoints

LatePoint’s operator surface is classic settings forms, calendars, and notification editors with no AI-native workflow anywhere in the booking flow (`research/sources/carte/latepoint/lib/views/settings/notifications.php:16`, `research/sources/carte/latepoint/lib/views/events/events_day_view.php:89`).

Orderable Pro invests in mobile checkout and status notifications, but its core interfaces are still WooCommerce templates and admin metaboxes rather than any conversational or automation-first control surface (`research/sources/carte/orderable-pro/woocommerce/checkout/form-checkout.php:35`, `research/sources/carte/orderable-pro/inc/modules/custom-order-status-pro/class-custom-order-status-pro-admin.php:144`).

RestroFood exposes dozens of AJAX actions for login, search, cart, checkout, tracking, branch transfer, slot generation, and delivery assignment, but none of that is elevated into an operator-facing AI workflow (`research/sources/carte/restrofood/inc/class-components-ajax.php:18`, `research/sources/carte/restrofood/inc/class-components-ajax.php:66`).

**Instead, we will…** make AI a first-class Carte admin surface with explicit tool boundaries over typed plugin routes, not a post-hoc add-on to brittle wp-admin workflows.

### 4. Peak-hour performance suffers when availability and ordering rely on heavyweight WordPress runtime state

LatePoint computes slot restrictions by combining routed requests, service settings, work periods, and overlap checks inside the WordPress request lifecycle, which is powerful but expensive in a monolithic PHP plugin during busy periods (`research/sources/carte/latepoint/lib/helpers/booking_helper.php:1152`, `research/sources/carte/latepoint/lib/helpers/resource_helper.php:167`).

Orderable Pro counts orders in a slot/day from WooCommerce order storage every time it validates capacity, tying fulfillment availability directly to repeated order queries (`research/sources/carte/orderable-pro/inc/modules/timings-pro/class-timings-pro.php:185`, `research/sources/carte/orderable-pro/inc/modules/timings-pro/class-timings-pro.php:222`).

RestroFood’s delivery availability flow depends on transients plus runtime location checks and branch schedule generation before checkout can proceed (`research/sources/carte/restrofood/inc/class-components-ajax.php:1485`, `research/sources/carte/restrofood/inc/class-date-time-map.php:187`).

**Instead, we will…** keep Carte availability as bounded read-time computation over explicit content/KV state with edge-friendly route contracts, not broad PHP runtime orchestration over Woo/WordPress globals.

### 5. Mobile checkout is usually a retrofit around legacy commerce plumbing

Orderable Pro has to replace WooCommerce’s checkout template and add a custom mobile summary toggle just to get a usable phone-first ordering flow (`research/sources/carte/orderable-pro/inc/modules/checkout-pro/class-checkout-pro-override-checkout.php:44`, `research/sources/carte/orderable-pro/woocommerce/checkout/form-checkout.php:37`).

RestroFood similarly wraps checkout in modal templates and custom overlays around Woo billing/shipping hooks instead of owning a native restaurant checkout architecture (`research/sources/carte/restrofood/view/modal-checkout.php:13`, `research/sources/carte/restrofood/view/modal-checkout.php:184`).

**Instead, we will…** design Carte checkout as a mobile-first storefront surface from the start instead of retrofitting phone UX onto WooCommerce-era templates.

### 6. Schema.org support is incomplete, inherited, or not restaurant-specific enough

Orderable’s plain-text custom status email template relies on WooCommerce’s generic `WC_Emails::order_schema_markup()` hook, which adds commerce email schema but says nothing about complete Restaurant/Menu JSON-LD for storefront discovery (`research/sources/carte/orderable-pro/inc/modules/custom-order-status-pro/templates/emails/plain/custom-status-template.php:25`).

Across the vendored sources, the only obvious schema artifacts are Gutenberg block metadata declarations (`$schema` in block manifests) rather than dedicated restaurant/menu structured-data generation, reinforcing the PRD claim that rich-results support is not a first-class product concern (`research/sources/carte/latepoint/blocks/src/book-form/block.json:2`, `research/sources/carte/orderable-pro/assets/blocks/location-picker/block.json:2`).

**Instead, we will…** emit explicit Restaurant/Menu JSON-LD from Carte views and validate it as a launch requirement instead of inheriting generic Woo/email schema hooks or treating block metadata as structured-data coverage.

## Specific implementation footguns we will not copy

1. **Hardcoded license secrets in plugin boot paths.** RestroFood writes a license key at load time, and Orderable mutates `orderable_settings` with a dashboard license key before normal bootstrap, which is a direct secret-handling and trust-boundary failure (`research/sources/carte/restrofood/restrofood.php:20`, `research/sources/carte/orderable-pro/orderable-pro.php:14`).
   - **Instead, we will…** keep licensing state server-verified and never seed mutable secrets into plugin options during bootstrap.

2. **Fabricated “valid” license responses cached locally.** RestroFood persists encrypted local license responses in options and, in the vendored source, short-circuits the validation path so the plugin can behave as licensed without a trustworthy server round-trip (`research/sources/carte/restrofood/restrofoodBase.php:466`, `research/sources/carte/restrofood/restrofoodBase.php:520`).
   - **Instead, we will…** follow the f-m1-trial-licensing decision: server-side checks at `license.carteplugin.dev` with a 24hr KV cache and graceful degrade on outage, never a fabricated local “valid” response.

3. **Ambient transient state as a hidden cross-request contract.** RestroFood stores visitor location, availability status, distance, branch id, and selected zip code in transients that unrelated checkout and pricing code later assumes are present (`research/sources/carte/restrofood/inc/class-components-ajax.php:1485`, `research/sources/carte/restrofood/inc/helper-functions.php:1028`).
   - **Instead, we will…** pass typed request context through explicit Carte route inputs and persist only the minimum durable state in content/KV with clear ownership.

4. **Generic catch-all AJAX routers with huge blast radius.** LatePoint routes broad application behavior through `latepoint_route_call`, and RestroFood exposes a long flat list of public/private `wp_ajax_*` handlers for almost every operation (`research/sources/carte/latepoint/latepoint.php:923`, `research/sources/carte/restrofood/inc/class-products.php:18`, `research/sources/carte/restrofood/inc/class-components-ajax.php:18`).
   - **Instead, we will…** use narrow plugin routes per capability so auth, observability, and error handling live at explicit boundaries.

5. **Overloaded settings hubs that mix policy, routing, and infrastructure secrets.** RestroFood’s admin tab strip packs delivery rules, page routing, location policy, invoice settings, and Google API key entry into one giant settings surface (`research/sources/carte/restrofood/admin/inc/admin-template.php:64`, `research/sources/carte/restrofood/admin/inc/tabs-content/location.php:41`).
   - **Instead, we will…** split Carte admin into focused task surfaces with opinionated defaults, keeping infrastructure secrets and operational policies behind targeted settings boundaries.

6. **Checkout as theme/template override sprawl.** Orderable and RestroFood both take over checkout by swapping Woo templates or modal shells around core hooks, which improves UX but creates ongoing compatibility debt (`research/sources/carte/orderable-pro/inc/modules/checkout-pro/class-checkout-pro-override-checkout.php:47`, `research/sources/carte/restrofood/inc/class-hooks.php:128`).
   - **Instead, we will…** own the storefront shell directly in Carte views and plugin routes rather than patching restaurant UX onto a third-party checkout template stack.

7. **Operator complexity exposed as low-level scheduling toggles.** LatePoint’s “Timeslot Availability Logic” settings expose multiple overlapping restriction toggles that reflect internal scheduling machinery rather than restaurant-friendly product defaults (`research/sources/carte/latepoint/lib/views/settings/general.php:213`).
   - **Instead, we will…** keep Carte scheduling logic explicit in code but present operators with simpler, domain-specific defaults instead of raw engine toggles.
