# Spec — `carte-core`

## ADDED Requirements

### Requirement: definePlugin manifest with canonical capabilities

The `@carte/core` package SHALL export a `definePlugin` manifest declaring exactly the capabilities `content:read`, `content:write`, `media:read`, no other capabilities, and SHALL NOT use deprecated `read:content` / `write:content` / `read:media` forms.

#### Scenario: Manifest validates against EmDash 0.9.0

- **GIVEN** a developer running `pnpm -F @carte/core exec emdash plugin validate`
- **WHEN** the command executes against the manifest
- **THEN** the command exits with status 0 and prints no warnings about deprecated capability forms.

#### Scenario: No deprecated capability forms in source

- **GIVEN** the source under `packages/core/src/`
- **WHEN** running `grep -E "(read|write):(content|media)\b|network:fetch\b" packages/core/src`
- **THEN** zero matches are returned.

### Requirement: Hooks use ctx.waitUntil for post-response work

The `content:beforeSave` hook SHALL synchronously validate `carte_*` collection writes and reject invalid input. The `content:afterSave` hook SHALL schedule cache invalidation via `ctx.waitUntil(...)` and SHALL NOT await the work on the response path.

#### Scenario: beforeSave rejects invalid menu item price

- **GIVEN** a `carte_menu_items` write with `price: -1`
- **WHEN** the `content:beforeSave` hook runs
- **THEN** the write is rejected with a descriptive error message.

#### Scenario: afterSave schedules invalidation in waitUntil

- **GIVEN** any write to a `carte_*` collection
- **WHEN** `content:afterSave` runs
- **THEN** `ctx.waitUntil` is called exactly once with the cache-invalidation promise; the hook handler returns synchronously without awaiting it.

### Requirement: Block Kit admin pages use canonical primitives

Admin pages at `/_emdash/api/plugins/carte-core/admin/{root,restaurant,hours,settings}` SHALL emit Block Kit JSON using `label` for buttons, `items` for stats blocks, plain string section text (no markdown), and SHALL NOT issue HTTP redirects.

#### Scenario: Settings page surfaces Cloudflare-Free degradation warning

- **GIVEN** a Cloudflare Free workspace
- **WHEN** GET `/admin/settings` is rendered
- **THEN** the JSON contains a section block warning that sandboxed isolation is degraded and citing emdash Issue #149.

### Requirement: 86 button + lazy-on-read auto-restore

When a menu item is "86'd," the system SHALL set `available: false` and `unavailableUntil: <next 6am local>`. On any read of menu items, items where `unavailableUntil < now` SHALL flip back to `available: true`. No scheduled cron job SHALL be used.

#### Scenario: Item auto-restores at 6am local

- **GIVEN** a menu item 86'd at 23:00 with `unavailableUntil = 06:00 next day`
- **WHEN** the menu is read at 06:01 next day
- **THEN** the item's `available` is `true` again.

#### Scenario: Item stays unavailable before the restore time

- **GIVEN** a menu item with `available = false` and `unavailableUntil = 06:00`
- **WHEN** the menu is read at 05:59
- **THEN** the item's `available` remains `false` and no content update is written.

#### Scenario: Concurrent reads restore once

- **GIVEN** two concurrent menu reads see the same expired 86'd menu item
- **WHEN** both reads perform lazy restore
- **THEN** only one content update is written for that item and timestamp.

#### Scenario: No cron in source

- **GIVEN** the source under `packages/core/src/`
- **WHEN** searching for cron-like patterns (`cron`, `scheduled`, `setInterval`)
- **THEN** zero matches in production code.

### Requirement: Schema.org JSON-LD generator validates against Google Rich Results Test

The `/schema-jsonld` route SHALL emit a `@type: Restaurant` payload with `address` (PostalAddress), `openingHoursSpecification`, `acceptsReservations`, `priceRange`, `servesCuisine`, and `hasMenu` → Menu → MenuSection → MenuItem with `offers` and `suitableForDiet`. The payload SHALL be cached in plugin KV under key `schema-jsonld` with TTL 1800 seconds, invalidated on any `carte_*` write via `ctx.waitUntil`. The payload SHALL pass the Google Rich Results Test.

#### Scenario: Restaurant payload has menu hierarchy

- **GIVEN** a restaurant profile, active menu, menu section, and available menu item
- **WHEN** GET `/schema-jsonld` runs
- **THEN** the response contains `@type: Restaurant`, `address.@type: PostalAddress`, `openingHoursSpecification`, `acceptsReservations`, `priceRange`, `servesCuisine`, and `hasMenu.hasMenuSection[].hasMenuItem[]` entries with `offers` and `suitableForDiet`.

#### Scenario: KV cache TTL 30 minutes

- **GIVEN** a request to `/schema-jsonld`
- **WHEN** the route writes to KV
- **THEN** the put call includes `expirationTtl: 1800`.

#### Scenario: Invalidated on content save

- **GIVEN** a save to `carte_menu_items`
- **WHEN** `content:afterSave` runs
- **THEN** `kv.delete('schema-jsonld')` is scheduled inside `ctx.waitUntil`.

### Requirement: Allergen + dietary taxonomy

`packages/core/src/taxonomy/allergens.ts` SHALL be the single source of truth for the EU FIC 14 mandatory allergens plus US extensions, and SHALL export a map from dietary tag to schema.org diet URI.

#### Scenario: All 14 EU allergens present

- **GIVEN** the exported allergen enum
- **WHEN** asserted against the EU FIC 14 list
- **THEN** every entry is present.

#### Scenario: Diet URI map uses canonical schema.org URIs

- **GIVEN** dietary tag `vegetarian`
- **WHEN** mapped via the export
- **THEN** the URI is `https://schema.org/VegetarianDiet`.

### Requirement: Allergen edits write audit entries (HR9)

Every change to `carte_menu_items.allergens` — manual, taxonomy-driven, or AI-assisted — SHALL emit an audit log entry capturing actor, before-set, after-set, and timestamp.

#### Scenario: Manual edit emits audit entry

- **GIVEN** an admin updating an item's allergens
- **WHEN** the write completes
- **THEN** an audit entry exists with the expected `{actor, before, after, timestamp}` shape.
