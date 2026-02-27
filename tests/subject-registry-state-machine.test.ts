/**
 * SubjectRegistry State Machine — Unit Tests
 * Organelle: ORG-IA-SUBJECT_REGISTRY-v0.1.0
 */

import { SubjectRegistryStateMachine } from "../src/state-machine";
import { SubjectRegistryState } from "../src/types";

describe("SubjectRegistryStateMachine", () => {
  let sm: SubjectRegistryStateMachine;

  beforeEach(() => {
    sm = new SubjectRegistryStateMachine();
  });

  it("should start in IDLE state", () => {
    expect(sm.getState()).toBe(SubjectRegistryState.IDLE);
  });

  it("should allow IDLE → PROCESSING", () => {
    expect(sm.canTransition(SubjectRegistryState.PROCESSING)).toBe(true);
    sm.transition(SubjectRegistryState.PROCESSING);
    expect(sm.getState()).toBe(SubjectRegistryState.PROCESSING);
  });

  it("should allow PROCESSING → COMPLETED", () => {
    sm.transition(SubjectRegistryState.PROCESSING);
    sm.transition(SubjectRegistryState.COMPLETED);
    expect(sm.getState()).toBe(SubjectRegistryState.COMPLETED);
  });

  it("should allow PROCESSING → ERROR", () => {
    sm.transition(SubjectRegistryState.PROCESSING);
    sm.transition(SubjectRegistryState.ERROR);
    expect(sm.getState()).toBe(SubjectRegistryState.ERROR);
  });

  it("should allow ERROR → IDLE via reset", () => {
    sm.transition(SubjectRegistryState.PROCESSING);
    sm.transition(SubjectRegistryState.ERROR);
    sm.reset();
    expect(sm.getState()).toBe(SubjectRegistryState.IDLE);
  });

  it("should reject invalid transitions", () => {
    expect(() => sm.transition(SubjectRegistryState.COMPLETED)).toThrow();
  });

  it("should maintain transition history", () => {
    sm.transition(SubjectRegistryState.PROCESSING);
    sm.transition(SubjectRegistryState.COMPLETED);
    const history = sm.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe(SubjectRegistryState.IDLE);
    expect(history[0].to).toBe(SubjectRegistryState.PROCESSING);
  });

  it("should allow IDLE → TERMINATED", () => {
    sm.transition(SubjectRegistryState.TERMINATED);
    expect(sm.getState()).toBe(SubjectRegistryState.TERMINATED);
  });

  it("should not allow transitions from TERMINATED", () => {
    sm.transition(SubjectRegistryState.TERMINATED);
    expect(sm.canTransition(SubjectRegistryState.IDLE)).toBe(false);
  });
});
