# `@carte/views`

Status: **v0.1 shipped**.

This is a **peer-dep npm library — NOT an EmDash plugin.** It ships
Astro components that consumers drop into their own storefront (their
own Astro site). No sandbox, no manifest, no `definePlugin()` call.

Shipped components (under `src/components/`):

- `RestaurantHero`, `RestaurantInfo`, `HoursWidget` — storefront chrome.
- `MenuDisplay`, `MenuSection`, `MenuItem` — menu rendering with inline
  schema.org JSON-LD.
- `DietaryFilter` — client-side dietary/allergen filter.
- `ReservationForm` — client island wired to `@carte/reservations`.
- `OrderingCart`, `OrderingCheckout` — client islands wired to
  `@carte/orders-backend`.
- `OrderRecordStatus`, `ReservationRecordStatus` — public confirmation
  / status pages.
- `CarteShell` — shared layout wrapper.

JSON-LD output is validated against Google Rich Results Test before
shipping. Known v0.1 issue: `DietaryFilter` crashes on unknown allergen
tags
([PRO-638](https://linear.app/projects-linear/issue/PRO-638/carteviews-dietaryfilter-crashes-on-unknown-allergen-tag-tolowercase)).
