/**
 * BoundaryContext State Machine — Unit Tests
 * Organelle: ORG-TB-BOUNDARY_CONTEXT-v0.1.0
 */

import { BoundaryContextStateMachine } from "../src/state-machine";
import { BoundaryContextState } from "../src/types";

describe("BoundaryContextStateMachine", () => {
  let sm: BoundaryContextStateMachine;

  beforeEach(() => {
    sm = new BoundaryContextStateMachine();
  });

  it("should start in IDLE state", () => {
    expect(sm.getState()).toBe(BoundaryContextState.IDLE);
  });

  it("should allow IDLE → PROCESSING", () => {
    expect(sm.canTransition(BoundaryContextState.PROCESSING)).toBe(true);
    sm.transition(BoundaryContextState.PROCESSING);
    expect(sm.getState()).toBe(BoundaryContextState.PROCESSING);
  });

  it("should allow PROCESSING → COMPLETED", () => {
    sm.transition(BoundaryContextState.PROCESSING);
    sm.transition(BoundaryContextState.COMPLETED);
    expect(sm.getState()).toBe(BoundaryContextState.COMPLETED);
  });

  it("should allow PROCESSING → ERROR", () => {
    sm.transition(BoundaryContextState.PROCESSING);
    sm.transition(BoundaryContextState.ERROR);
    expect(sm.getState()).toBe(BoundaryContextState.ERROR);
  });

  it("should allow ERROR → IDLE via reset", () => {
    sm.transition(BoundaryContextState.PROCESSING);
    sm.transition(BoundaryContextState.ERROR);
    sm.reset();
    expect(sm.getState()).toBe(BoundaryContextState.IDLE);
  });

  it("should reject invalid transitions", () => {
    expect(() => sm.transition(BoundaryContextState.COMPLETED)).toThrow();
  });

  it("should maintain transition history", () => {
    sm.transition(BoundaryContextState.PROCESSING);
    sm.transition(BoundaryContextState.COMPLETED);
    const history = sm.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe(BoundaryContextState.IDLE);
    expect(history[0].to).toBe(BoundaryContextState.PROCESSING);
  });

  it("should allow IDLE → TERMINATED", () => {
    sm.transition(BoundaryContextState.TERMINATED);
    expect(sm.getState()).toBe(BoundaryContextState.TERMINATED);
  });

  it("should not allow transitions from TERMINATED", () => {
    sm.transition(BoundaryContextState.TERMINATED);
    expect(sm.canTransition(BoundaryContextState.IDLE)).toBe(false);
  });
});
