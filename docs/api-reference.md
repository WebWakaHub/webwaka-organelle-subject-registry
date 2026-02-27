# SubjectRegistry — API Reference

## Types

### SubjectRegistryConfig
```typescript
interface SubjectRegistryConfig {
  id: string;
  name: string;
  maxConcurrency: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
}
```

### SubjectRegistryCommand
```typescript
interface SubjectRegistryCommand {
  type: "REGISTER" | "LOOKUP" | "UPDATE" | "ARCHIVE";
  payload: Record<string, unknown>;
  correlationId: string;
  timestamp: number;
}
```

### SubjectData
```typescript
interface SubjectData {
  subjectId: string;
  type: string;
  name: string;
  attributes: Record<string, unknown>;
  status: "active" | "suspended" | "archived" | "deleted";
  createdAt: number;
  updatedAt: number;
}
```
