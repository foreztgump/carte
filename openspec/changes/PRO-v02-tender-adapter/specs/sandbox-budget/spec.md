# Spec — `sandbox-budget`

> **Linear:** PRO-640, PRO-727, PRO-734, PRO-737

## MODIFIED Requirements

### Requirement: Sandbox budget reports SHALL display margins from active caps

`scripts/audit-sandbox-budget.ts` SHALL compute displayed margin text from
`scripts/sandbox-cost-table.json` `costTable.caps`, not hard-coded 10
subrequests or 50ms CPU literals.

#### Scenario: Default caps display current margins

- **GIVEN** `scripts/sandbox-cost-table.json` declares `caps.subrequests: 10`
  and `caps.cpuMs: 50`
- **WHEN** the sandbox budget auditor prints handler margins
- **THEN** each margin is calculated from those cap values.

#### Scenario: Mutated caps alter display output

- **GIVEN** a test fixture mutates active caps to `subrequests: 20` and
  `cpuMs: 100`
- **WHEN** the auditor formats a report for the fixture
- **THEN** displayed margin text reflects the mutated caps rather than the
  original defaults.

### Requirement: Tender adapter handlers SHALL remain under sandbox caps

All sandboxed Carte handlers affected by PRO-727 and PRO-734 SHALL remain below
the hard sandbox budget of 10 subrequests and 50ms CPU.

#### Scenario: Tender checkout remains under cap

- **GIVEN** the sandbox budget auditor
- **WHEN** it analyzes the orders-backend checkout path
- **THEN** estimated subrequests and CPU remain under `costTable.caps`.

#### Scenario: Tender refund remains under cap

- **GIVEN** the sandbox budget auditor
- **WHEN** it analyzes the orders-backend refund path
- **THEN** estimated subrequests and CPU remain under `costTable.caps`.

#### Scenario: Tender payment hooks remain under cap

- **GIVEN** the sandbox budget auditor
- **WHEN** it analyzes `tender:payment.succeeded` and
  `tender:payment.refunded` handlers
- **THEN** each handler remains under `costTable.caps`
- **AND** the report leaves positive headroom.

### Requirement: Budget failures SHALL fail closed

The budget auditor SHALL exit non-zero if any analyzed handler exceeds active
caps, including future cap changes.

#### Scenario: Handler exceeds active cap

- **GIVEN** a handler estimate above `costTable.caps.subrequests` or
  `costTable.caps.cpuMs`
- **WHEN** the auditor runs
- **THEN** it reports the handler as over budget
- **AND** exits with failure.
