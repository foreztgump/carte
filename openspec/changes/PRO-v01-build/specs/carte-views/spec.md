# Spec — `carte-views`

## ADDED Requirements

### Requirement: Astro peer-dep package

`@carte/views` SHALL declare Astro as a peerDependency, contain no `definePlugin` export, no `wrangler.toml`, and ship Astro components consumable in any user Astro project.

#### Scenario: Peer dependency declared

- **GIVEN** `packages/views/package.json`
- **WHEN** inspected
- **THEN** `astro` appears under `peerDependencies` and not under `dependencies`.

### Requirement: Components accept data as props (SG7)

No component in `@carte/views/src/components/*.astro` SHALL fetch data internally. All data SHALL flow in via props, populated by the consuming Astro page using `getEmDashCollection` / `getEmDashEntry`.

#### Scenario: No fetch in component sources

- **GIVEN** the components source
- **WHEN** searching `grep -E "fetch\(|getEmDashCollection" packages/views/src/components`
- **THEN** zero matches.

### Requirement: Tailwind default + headless variants

Each component SHALL ship a Tailwind-styled default and a headless / unstyled variant for theme customisation.

### Requirement: Mobile-first checkout summary toggle (PRO-471)

`<OrderingCheckout>` SHALL render with a collapsible summary toggle that defaults to collapsed at viewports ≤ 480px.

#### Scenario: Mobile summary collapsed by default

- **GIVEN** a viewport of 375×812
- **WHEN** the checkout page renders
- **THEN** the summary section is collapsed; the toggle expands it on click; expanded state persists across navigation.

### Requirement: DietaryFilter uses @carte/core taxonomy

`<DietaryFilter>` SHALL render filter chips driven by the dietary tag map exported from `@carte/core/taxonomy`.

### Requirement: Storefront page emits Rich-Results-clean JSON-LD

A fixture Astro page consuming `<RestaurantHero>` and `<MenuDisplay>` SHALL emit JSON-LD that passes the Google Rich Results Test.

### Requirement: a11y AA baseline + performance budget

Every storefront component rendered by Playwright SHALL produce zero serious or critical WCAG 2.1 AA violations under axe-core, and the consuming fixture page SHALL achieve Lighthouse performance ≥ 80 with passing CWV thresholds (LCP, CLS, INP).

### Requirement: Explicit success records (PRO-470)

Order and reservation success pages SHALL render status + summary given query params (`orderId` or `reservationToken`) and SHALL pass a11y AA.
