import { SubjectRegistryStateMachine } from "../src/state-machine";
import { SubjectRegistryState } from "../src/types";

describe("SubjectRegistryStateMachine", () => {
  let sm: SubjectRegistryStateMachine;
  beforeEach(() => { sm = new SubjectRegistryStateMachine(); });

  it("should start in IDLE", () => { expect(sm.getState()).toBe(SubjectRegistryState.IDLE); });
  it("should allow IDLE to PROCESSING", () => { sm.transition(SubjectRegistryState.PROCESSING); expect(sm.getState()).toBe(SubjectRegistryState.PROCESSING); });
  it("should allow PROCESSING to COMPLETED", () => { sm.transition(SubjectRegistryState.PROCESSING); sm.transition(SubjectRegistryState.COMPLETED); expect(sm.getState()).toBe(SubjectRegistryState.COMPLETED); });
  it("should allow PROCESSING to ERROR", () => { sm.transition(SubjectRegistryState.PROCESSING); sm.transition(SubjectRegistryState.ERROR); expect(sm.getState()).toBe(SubjectRegistryState.ERROR); });
  it("should allow ERROR to IDLE via reset", () => { sm.transition(SubjectRegistryState.PROCESSING); sm.transition(SubjectRegistryState.ERROR); sm.reset(); expect(sm.getState()).toBe(SubjectRegistryState.IDLE); });
  it("should reject invalid transitions", () => { expect(() => sm.transition(SubjectRegistryState.COMPLETED)).toThrow(); });
  it("should maintain history", () => { sm.transition(SubjectRegistryState.PROCESSING); sm.transition(SubjectRegistryState.COMPLETED); expect(sm.getHistory()).toHaveLength(2); });
});
