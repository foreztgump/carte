# `@carte/views`

Status: **skeleton (v0.1)** — no business logic yet.

This is a **peer-dep npm library — NOT an EmDash plugin.** It ships
Astro components and React building blocks that consumers drop into
their own storefront (their own Astro site, their own React app). No
sandbox, no manifest, no `definePlugin()` call.

The future v0.1 surface (later mission):

- `MenuItem`, `MenuSection`, `Menu` — server components rendering
  schema.org JSON-LD inline.
- `ReservationForm`, `OrderCart` — client islands wiring up
  `@carte/reservations` and `@carte/orders-backend` plugin routes.
- Validate JSON-LD output against Google Rich Results Test before
  shipping any storefront component.
