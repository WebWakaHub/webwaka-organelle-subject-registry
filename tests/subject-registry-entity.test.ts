import { SubjectRegistryEntity } from "../src/subject-registry-entity";
import { SubjectRegistryConfig, SubjectRegistryState, SubjectRegistryCommand } from "../src/types";

describe("SubjectRegistryEntity", () => {
  let entity: SubjectRegistryEntity;
  const config: SubjectRegistryConfig = { id: "test-sr-001", name: "Test SubjectRegistry", maxConcurrency: 5, timeoutMs: 30000, retryPolicy: { maxRetries: 3, backoffMs: 100, backoffMultiplier: 2 } };
  beforeEach(() => { entity = new SubjectRegistryEntity(config); });

  it("should initialize with IDLE state", () => { expect(entity.getState()).toBe(SubjectRegistryState.IDLE); });
  it("should have correct ID", () => { expect(entity.getId()).toBe("test-sr-001"); });
  it("should start with zero subjects", () => { expect(entity.getSubjectCount()).toBe(0); });
  it("should register a new subject", () => { const cmd: SubjectRegistryCommand = { type: "REGISTER", payload: { subjectId: "s1", name: "Test Subject", type: "user" }, correlationId: "c1", timestamp: Date.now() }; const r = entity.execute(cmd); expect(r.success).toBe(true); expect(entity.getSubjectCount()).toBe(1); });
  it("should reject duplicate registration", () => { entity.execute({ type: "REGISTER", payload: { subjectId: "s1" }, correlationId: "c1", timestamp: Date.now() }); const r = entity.execute({ type: "REGISTER", payload: { subjectId: "s1" }, correlationId: "c2", timestamp: Date.now() }); expect(r.success).toBe(false); });
  it("should lookup a registered subject", () => { entity.execute({ type: "REGISTER", payload: { subjectId: "s2", name: "Lookup Test" }, correlationId: "c3", timestamp: Date.now() }); const r = entity.execute({ type: "LOOKUP", payload: { subjectId: "s2" }, correlationId: "c4", timestamp: Date.now() }); expect(r.success).toBe(true); });
  it("should archive a subject", () => { entity.execute({ type: "REGISTER", payload: { subjectId: "s3" }, correlationId: "c5", timestamp: Date.now() }); const r = entity.execute({ type: "ARCHIVE", payload: { subjectId: "s3" }, correlationId: "c6", timestamp: Date.now() }); expect(r.success).toBe(true); });
  it("should handle unknown commands", () => { const r = entity.execute({ type: "UNKNOWN", payload: {}, correlationId: "c7", timestamp: Date.now() }); expect(r.success).toBe(false); });
  it("should reject invalid transitions", () => { expect(() => entity.setState(SubjectRegistryState.COMPLETED)).toThrow(); });
  it("should track metrics", () => { entity.execute({ type: "REGISTER", payload: { subjectId: "s4" }, correlationId: "c8", timestamp: Date.now() }); const m = entity.getMetrics(); expect(m.totalOperations).toBe(1); });
});
