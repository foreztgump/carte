# Tasks

- [ ] Add a locked stack pin to `AGENTS.md` for the EmDash plugin SDK.
  - Acceptance: `AGENTS.md` includes `EmDash plugin SDK: pinned to ^0.9.0 (released 2026-05-01).` and notes that Carte avoids `emdash@1.0.0` because it is not `latest`-tagged and removes `locals.emdash.invalidateManifest`.
- [ ] Mirror the EmDash SDK pin into `openspec/config.yaml`.
  - Acceptance: `openspec/config.yaml` has a stack pin entry for EmDash at `^0.9.0` and no longer says the version is unverified or should remain unlocked.
- [ ] Verify the lock is consistent and transition the issue state.
  - Acceptance: grep finds the pinned version text in both files, finds no `verify before lock` hedge in `openspec/config.yaml`, and the owning Linear issue is no longer In Progress.
