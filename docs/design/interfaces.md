# SubjectRegistry — Interface Contracts

## Primary Interface

```typescript
interface ISubjectRegistry {
  readonly id: string;
  readonly state: SubjectRegistryState;
  
  execute(command: SubjectRegistryCommand): Promise<SubjectRegistryResult>;
  query(query: SubjectRegistryQuery): SubjectRegistryQueryResult;
  reset(): void;
  terminate(): void;
  getMetrics(): OperationMetrics;
}
```

## Storage Interface

```typescript
interface ISubjectRegistryStorage {
  save(entity: SubjectRegistryEntity): Promise<void>;
  load(id: string): Promise<SubjectRegistryEntity | null>;
  delete(id: string): Promise<boolean>;
}
```

## Event Interface

```typescript
interface ISubjectRegistryEvents {
  emit(event: SubjectRegistryEvent): void;
  subscribe(handler: (event: SubjectRegistryEvent) => void): () => void;
}
```
