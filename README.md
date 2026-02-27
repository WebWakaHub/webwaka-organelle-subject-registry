# SubjectRegistry Organelle

**Organelle ID:** ORG-IA-SUBJECT_REGISTRY-v0.1.0
**Version:** 0.1.0
**Layer:** Organelle (Biological Hierarchy)

## Overview

The SubjectRegistry organelle manages the registration, lookup, and lifecycle of subject entities within the WebWaka biological hierarchy. It provides deterministic subject management with full audit trails and event emission.

## Quick Start

```typescript
import { SubjectRegistryOrchestrator } from "@webwaka/organelle-subject-registry";

const orch = new SubjectRegistryOrchestrator({
  id: "my-subject-registry",
  name: "My SubjectRegistry",
  maxConcurrency: 5,
  timeoutMs: 30000,
  retryPolicy: { maxRetries: 3, backoffMs: 100, backoffMultiplier: 2 }
});

// Register a subject
const result = await orch.execute({
  type: "REGISTER",
  payload: { subjectId: "user-001", name: "John Doe", type: "user" },
  correlationId: "corr-001",
  timestamp: Date.now()
});
```

## API

| Method | Returns | Description |
|:-------|:--------|:------------|
| `execute(cmd)` | `Promise<Result>` | Execute command (REGISTER, LOOKUP, UPDATE, ARCHIVE) |
| `query(q)` | `QueryResult` | Query state |
| `getState()` | `State` | Current state |
| `getMetrics()` | `Metrics` | Operation metrics |
| `getTelemetry()` | `Telemetry` | Telemetry data |

## Testing

```bash
npm test
```
