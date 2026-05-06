## Given

- `docs/competitive-analysis/adoptable-patterns.md` contains Milestone 0 synthesis entries tagged `MUST-ADOPT` or `SHOULD-ADOPT`
- each entry includes plugin evidence and a proposed Carte target

## When

- Milestone 0 backlog reconciliation runs

## Then

- every `MUST-ADOPT` and `SHOULD-ADOPT` pattern has a Linear sub-task under the correct epic with the `repo:carte` label and the cited plugin/file:line evidence
- OQ issues affected by those patterns contain summary comments pointing back to the synthesis evidence
- `docs/competitive-analysis/adoptable-patterns.md` records the created `PRO-XXX` IDs for all adoptable patterns
