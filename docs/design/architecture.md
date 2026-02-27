# SubjectRegistry — Architectural Design

## Component Diagram

```
┌─────────────────────────────────────────┐
│           SubjectRegistry Orchestrator              │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │  State    │  │  SubjectRegistryEntity          │ │
│  │  Machine  │  │  (Domain Logic)      │ │
│  └──────────┘  └──────────────────────┘ │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ Storage   │  │ Events   │  │ Obs.  │ │
│  │ Interface │  │ Interface│  │ Port  │ │
│  └──────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────┘
```

## Design Decisions

1. **Orchestrator Pattern:** Single entry point coordinates all internal components
2. **Entity Separation:** Domain logic isolated in entity class
3. **Interface Segregation:** Storage, events, and observability are separate interfaces
4. **Dependency Injection:** All interfaces injected via constructor
