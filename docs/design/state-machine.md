# SubjectRegistry — State Machine Design

## States

| State | Description |
|:------|:------------|
| IDLE | Ready to accept commands |
| PROCESSING | Actively executing a command |
| COMPLETED | Last execution successful |
| ERROR | Unrecoverable error state |
| TERMINATED | Permanently shut down |

## Transitions

```
IDLE → PROCESSING (on command received)
PROCESSING → COMPLETED (on success)
PROCESSING → ERROR (on failure)
COMPLETED → IDLE (auto-reset)
ERROR → IDLE (on reset)
IDLE → TERMINATED (on shutdown)
```
