# SubjectRegistry — Invariants & Constraints

## Structural Invariants

1. **Subject ID Uniqueness:** No two subjects may share the same identifier
2. **State Machine Integrity:** Only valid state transitions are permitted
3. **Audit Completeness:** Every state change produces an audit entry
4. **Event Ordering:** Events are emitted in strict causal order

## Behavioral Constraints

1. **Determinism:** Same input always produces same output
2. **Isolation:** No shared mutable state with other organelles
3. **Idempotency:** Duplicate registration commands are safely handled
4. **Referential Integrity:** Subject references cannot be orphaned
