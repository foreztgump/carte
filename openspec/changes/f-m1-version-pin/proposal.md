# Proposal

Lock the EmDash SDK version pin for Carte by adding an explicit stack pin to `AGENTS.md` and mirroring the same pin into `openspec/config.yaml`. This removes the remaining "verify before lock" hedge from project configuration context and records why Carte stays on `^0.9.0` instead of `emdash@1.0.0`.
