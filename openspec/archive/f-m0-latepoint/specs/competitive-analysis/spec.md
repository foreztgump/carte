## Competitive analysis

### Requirement: LatePoint teardown document exists

Given the Milestone 0 LatePoint research source
When the feature is complete
Then `docs/competitive-analysis/latepoint.md` exists with sections for architecture, reservation domain model, time-slot generation, email/notification pipeline, admin UX patterns, strengths, and weaknesses.

### Requirement: LatePoint findings are evidence-backed

Given claims about LatePoint behavior
When they appear in the teardown
Then each section includes file:line citations into `research/sources/carte/latepoint/`, with at least ten distinct citations across the document.

### Requirement: Time-slot analysis compares against Carte's PRD

Given PRD §`Time-slot generation`
When the teardown explains LatePoint's slot-generation algorithm
Then it explicitly compares LatePoint's persisted-resource approach to Carte's read-time computation pattern and concludes ADOPT, ADAPT, or REJECT with rationale.
