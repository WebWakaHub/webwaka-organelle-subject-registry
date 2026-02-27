# BoundaryContext — State Machine Design

## States

| State | Description | Entry Condition |
|:------|:------------|:----------------|
| `IDLE` | Ready to accept commands | Initial state or after reset |
| `PROCESSING` | Actively executing a command | Command received |
| `COMPLETED` | Command executed successfully | Processing finished |
| `ERROR` | Unrecoverable error occurred | Exception during processing |
| `TERMINATED` | Organelle shut down | Explicit termination request |

## Transitions

```
IDLE → PROCESSING (on: command received)
PROCESSING → COMPLETED (on: execution success)
PROCESSING → ERROR (on: execution failure)
COMPLETED → IDLE (on: result acknowledged)
ERROR → IDLE (on: explicit reset)
IDLE → TERMINATED (on: shutdown request)
```

## Guards

- `IDLE → PROCESSING`: Command must pass schema validation
- `PROCESSING → COMPLETED`: All invariants must hold post-execution
- `ERROR → IDLE`: Reset must clear all transient state
