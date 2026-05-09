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

#### Scenario: Default and headless export shapes

- **GIVEN** any component module under `packages/views/src/components/`
- **WHEN** the module is imported by a consumer Astro project
- **THEN** both a Tailwind-styled default export and a headless / unstyled variant are available.

### Requirement: Mobile-first checkout summary toggle (PRO-471)

`<OrderingCheckout>` SHALL render with a collapsible summary toggle that defaults to collapsed at viewports ≤ 480px.

#### Scenario: Mobile summary collapsed by default

- **GIVEN** a viewport of 375×812
- **WHEN** the checkout page renders
- **THEN** the summary section is collapsed; the toggle expands it on click; expanded state persists across navigation.

### Requirement: DietaryFilter uses @carte/core taxonomy

`<DietaryFilter>` SHALL render filter chips driven by the dietary tag map exported from `@carte/core/taxonomy`.

#### Scenario: Filter chips reflect taxonomy entries

- **GIVEN** a fixture page rendering `<DietaryFilter>`
- **WHEN** the component imports its tag list
- **THEN** the imported map comes from `@carte/core/taxonomy` and a filter chip exists for each dietary tag.

### Requirement: Storefront page emits Rich-Results-clean JSON-LD

A fixture Astro page consuming `<RestaurantHero>` and `<MenuDisplay>` SHALL emit JSON-LD that passes the Google Rich Results Test.

#### Scenario: Fixture page passes Google Rich Results Test

- **GIVEN** a fixture Astro page using `<RestaurantHero>` + `<MenuDisplay>`
- **WHEN** its rendered HTML is submitted to the Google Rich Results Test
- **THEN** the test passes (screenshot attached on the milestone PR).

### Requirement: a11y AA baseline + performance budget

Every storefront component rendered by Playwright SHALL produce zero serious or critical WCAG 2.1 AA violations under axe-core, and the consuming fixture page SHALL achieve Lighthouse performance ≥ 80 with passing CWV thresholds (LCP, CLS, INP).

#### Scenario: axe-core clean and Lighthouse ≥ 80

- **GIVEN** the fixture Astro page consuming the storefront components rendered under Playwright
- **WHEN** axe-core runs against every component and Lighthouse audits the page
- **THEN** zero serious or critical WCAG 2.1 AA violations are reported and Lighthouse performance score is ≥ 80 with LCP/CLS/INP within passing thresholds.

### Requirement: Explicit success records (PRO-470)

Order and reservation success pages SHALL render status + summary given query params (`orderId` or `reservationToken`) and SHALL pass a11y AA.

#### Scenario: Success page renders status from query params

- **GIVEN** a navigation to a success page with `?orderId=...` or `?reservationToken=...`
- **WHEN** the page renders
- **THEN** the status and summary are visible and the page reports zero serious or critical WCAG 2.1 AA violations under axe-core.
