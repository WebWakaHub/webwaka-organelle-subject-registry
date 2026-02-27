# SubjectRegistry — Architectural Design

## Component Diagram

```
┌──────────────────────────────────────────┐
│       SubjectRegistryOrchestrator                   │
│  ┌──────────┐  ┌─────────────────────┐   │
│  │  State    │  │  SubjectRegistryEntity         │   │
│  │  Machine  │  │  (Registration,    │   │
│  │           │  │   Lookup, Lifecycle)│   │
│  └──────────┘  └─────────────────────┘   │
│  ┌──────────┐  ┌──────┐  ┌───────────┐   │
│  │ Storage  │  │Events│  │ Observ.   │   │
│  └──────────┘  └──────┘  └───────────┘   │
└──────────────────────────────────────────┘
```
