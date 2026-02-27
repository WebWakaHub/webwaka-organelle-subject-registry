# SubjectRegistry — Deployment Guide

## Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.0.0

## Installation

```bash
npm install @webwaka/organelle-subject-registry
```

## Configuration

The organelle requires a configuration object at instantiation:

```typescript
const config = {
  id: "unique-organelle-id",
  name: "Human-readable name",
  maxConcurrency: 5,
  timeoutMs: 30000,
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 100,
    backoffMultiplier: 2,
  },
};
```

## Health Checks

```typescript
const telemetry = orchestrator.getTelemetry();
console.log(telemetry.state);   // Should be "IDLE"
console.log(telemetry.metrics); // Operation counts
```

## Monitoring

The observability interface provides:
- Structured logging (DEBUG, INFO, WARN, ERROR)
- Metric recording
- Span tracing
- Telemetry export
