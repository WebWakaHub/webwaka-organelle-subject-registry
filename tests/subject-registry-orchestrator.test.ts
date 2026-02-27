import { SubjectRegistryOrchestrator } from "../src/subject-registry-orchestrator";
import { SubjectRegistryConfig, SubjectRegistryState } from "../src/types";
import { InMemorySubjectRegistryStorage } from "../src/storage-interface";
import { SubjectRegistryEventBus } from "../src/event-interface";

describe("SubjectRegistryOrchestrator", () => {
  let orch: SubjectRegistryOrchestrator;
  let storage: InMemorySubjectRegistryStorage;
  let eventBus: SubjectRegistryEventBus;
  const config: SubjectRegistryConfig = { id: "orch-sr-001", name: "Test Orch", maxConcurrency: 5, timeoutMs: 30000, retryPolicy: { maxRetries: 3, backoffMs: 100, backoffMultiplier: 2 } };
  beforeEach(() => { storage = new InMemorySubjectRegistryStorage(); eventBus = new SubjectRegistryEventBus(); orch = new SubjectRegistryOrchestrator(config, storage, eventBus); });

  it("should initialize in IDLE", () => { expect(orch.getState()).toBe(SubjectRegistryState.IDLE); });
  it("should register and persist", async () => { const r = await orch.execute({ type: "REGISTER", payload: { subjectId: "s1", name: "x" }, correlationId: "c1", timestamp: Date.now() }); expect(r.success).toBe(true); expect(storage.size()).toBe(1); });
  it("should emit events on registration", async () => { const events: any[] = []; eventBus.subscribe(e => events.push(e)); await orch.execute({ type: "REGISTER", payload: { subjectId: "s2" }, correlationId: "c2", timestamp: Date.now() }); expect(events.length).toBeGreaterThan(0); });
  it("should return valid telemetry", () => { const t = orch.getTelemetry(); expect(t.organelleId).toBe("orch-sr-001"); });
});
