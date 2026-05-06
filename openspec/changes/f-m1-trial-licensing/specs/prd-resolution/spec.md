# Spec

## Given/When/Then

### Scenario: Trial enforcement is locked in the PRD
- **Given** OQ#5 asks how `@carte/ai` enforces trials and paid licenses
- **When** the PRO-421 documentation change is applied
- **Then** `PRD.md` §"Trial & licensing" specifies a server-side check at `license.carteplugin.dev` backed by a 24-hour KV cache
- **And** the section states outages continue at the last cached state instead of locking out restaurant operations
- **And** the section names Lemon Squeezy as the recommended billing provider and Worker + D1 as the license-server stack
- **And** OQ#5 is marked `**RESOLVED**` with a pointer to the locked section
