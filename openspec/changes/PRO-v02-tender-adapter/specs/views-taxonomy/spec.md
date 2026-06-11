# Spec — `views-taxonomy`

> **Linear:** PRO-638, PRO-737

## MODIFIED Requirements

### Requirement: Allergen labels SHALL be total for arbitrary tags

`@carte/core` taxonomy SHALL provide `allergenLabelFor(tag): string` for every
input tag. Unknown tags SHALL return a humanized fallback instead of
`undefined`.

#### Scenario: Known allergen returns canonical label

- **GIVEN** a known allergen tag from `ALLERGEN_LABELS`
- **WHEN** `allergenLabelFor(tag)` is called
- **THEN** it returns the canonical display label.

#### Scenario: Unknown allergen returns humanized fallback

- **GIVEN** an unknown allergen tag such as `black-walnut-oil`
- **WHEN** `allergenLabelFor(tag)` is called
- **THEN** it returns `black walnut oil`
- **AND** the return value is a non-empty string.

### Requirement: DietaryFilter SHALL tolerate unknown allergen tags

`@carte/views` `DietaryFilter` SHALL render safely when menu data includes an
unknown allergen tag.

#### Scenario: Unknown tag does not crash rendering

- **GIVEN** a storefront menu fixture containing an allergen tag not present in
  `ALLERGEN_LABELS`
- **WHEN** `DietaryFilter` renders labels and lower-case comparisons
- **THEN** it does not throw `Cannot read properties of undefined`
- **AND** it renders or filters using the humanized fallback label.

#### Scenario: Fixture remains intentional

- **GIVEN** `e2e/views/fixture/`
- **WHEN** allergen tags are inspected
- **THEN** every tag is either present in `ALLERGEN_LABELS`
- **OR** intentionally exercises the unknown-tag fallback behavior introduced by
  PRO-638.

### Requirement: Taxonomy fallback SHALL NOT change write behavior

The PRO-638 fix SHALL be render-only and SHALL NOT alter allergen audit behavior
or the canonical taxonomy map.

#### Scenario: Allergen edit auditing remains unchanged

- **GIVEN** existing allergen write paths in Carte
- **WHEN** the unknown-label fallback exists
- **THEN** writes still use the existing audit behavior
- **AND** the fallback only affects read/display labels.
