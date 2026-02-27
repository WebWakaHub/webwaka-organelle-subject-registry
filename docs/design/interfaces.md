# BoundaryContext — Interface Contracts

## Primary Interface

```typescript
interface IBoundaryContext {
  readonly id: string;
  readonly state: BoundaryContextState;
  
  execute(command: BoundaryContextCommand): Promise<BoundaryContextResult>;
  query(query: BoundaryContextQuery): BoundaryContextQueryResult;
  reset(): void;
  terminate(): void;
  getMetrics(): OperationMetrics;
}
```

## Storage Interface

```typescript
interface IBoundaryContextStorage {
  save(entity: BoundaryContextEntity): Promise<void>;
  load(id: string): Promise<BoundaryContextEntity | null>;
  delete(id: string): Promise<boolean>;
}
```

## Event Interface

```typescript
interface IBoundaryContextEvents {
  emit(event: BoundaryContextEvent): void;
  subscribe(handler: (event: BoundaryContextEvent) => void): () => void;
}
```
