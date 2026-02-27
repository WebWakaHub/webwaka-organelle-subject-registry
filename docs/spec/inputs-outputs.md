# SubjectRegistry — Canonical Inputs & Outputs

## Input Ports

| Port | Type | Description |
|:-----|:-----|:------------|
| `command` | `SubjectRegistryCommand` | Primary command input (REGISTER, UPDATE, LOOKUP, ARCHIVE) |
| `query` | `SubjectRegistryQuery` | Read-only query input for subject lookups |
| `event` | `DomainEvent` | External event input for cross-organelle coordination |

## Output Ports

| Port | Type | Description |
|:-----|:-----|:------------|
| `result` | `SubjectRegistryResult` | Command execution result with subject data |
| `event` | `SubjectRegistryEvent` | Domain events emitted on subject changes |
| `telemetry` | `TelemetryData` | Observability data for monitoring |
| `audit` | `AuditEntry` | Audit trail entries for compliance |
