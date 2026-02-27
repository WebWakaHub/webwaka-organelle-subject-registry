# SubjectRegistry — API Reference

## Types

### SubjectRegistryConfig
```typescript
interface SubjectRegistryConfig {
  readonly id: string;
  readonly name: string;
  readonly maxConcurrency: number;
  readonly timeoutMs: number;
  readonly retryPolicy: RetryPolicy;
}
```

### SubjectRegistryCommand
```typescript
interface SubjectRegistryCommand {
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
  readonly timestamp: number;
}
```

### SubjectRegistryResult
```typescript
interface SubjectRegistryResult {
  readonly success: boolean;
  readonly data?: Record<string, unknown>;
  readonly error?: SubjectRegistryError;
  readonly duration: number;
  readonly correlationId: string;
}
```

## State Machine

States: IDLE → PROCESSING → COMPLETED → IDLE (success path)
States: IDLE → PROCESSING → ERROR → IDLE (error path)
States: IDLE → TERMINATED (shutdown path)
