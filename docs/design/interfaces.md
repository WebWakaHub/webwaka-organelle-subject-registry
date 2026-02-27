# SubjectRegistry — Interface Contracts

```typescript
interface ISubjectRegistry {
  readonly id: string;
  readonly state: SubjectRegistryState;
  register(subject: SubjectData): Promise<SubjectRegistryResult>;
  lookup(id: string): Promise<SubjectData | null>;
  update(id: string, data: Partial<SubjectData>): Promise<SubjectRegistryResult>;
  archive(id: string): Promise<SubjectRegistryResult>;
  execute(command: SubjectRegistryCommand): Promise<SubjectRegistryResult>;
  query(query: SubjectRegistryQuery): SubjectRegistryQueryResult;
  reset(): void;
  terminate(): void;
}
```
