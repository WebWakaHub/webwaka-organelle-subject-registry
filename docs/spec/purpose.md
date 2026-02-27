# SubjectRegistry Organelle — Purpose & Responsibility

**Organelle:** ORG-IA-SUBJECT_REGISTRY-v0.1.0
**Version:** 0.1.0

## Purpose

The SubjectRegistry organelle provides a self-contained, deterministic functional unit within the WebWaka biological hierarchy. It encapsulates domain-specific logic for subject registry operations — managing the registration, lookup, and lifecycle of subject entities within the system.

## Core Responsibilities

1. **Subject Registration:** Register new subjects with unique identifiers and metadata
2. **Subject Lookup:** Provide fast, indexed lookup of subjects by ID, type, or attributes
3. **Lifecycle Management:** Track subject state transitions (active, suspended, archived, deleted)
4. **Audit Trail:** Maintain a complete audit log of all subject operations
5. **Event Emission:** Emit domain events for subject lifecycle changes
