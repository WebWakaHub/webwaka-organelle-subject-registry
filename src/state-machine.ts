/**
 * BoundaryContext — State Machine
 * Organelle: ORG-TB-BOUNDARY_CONTEXT-v0.1.0
 */

import { BoundaryContextState } from "./types";

interface Transition {
  from: BoundaryContextState;
  to: BoundaryContextState;
  guard?: () => boolean;
}

export class BoundaryContextStateMachine {
  private currentState: BoundaryContextState;
  private readonly transitions: Transition[];
  private readonly history: Array<{ from: BoundaryContextState; to: BoundaryContextState; timestamp: number }>;

  constructor(initialState: BoundaryContextState = BoundaryContextState.IDLE) {
    this.currentState = initialState;
    this.history = [];
    this.transitions = [
      { from: BoundaryContextState.IDLE, to: BoundaryContextState.PROCESSING },
      { from: BoundaryContextState.PROCESSING, to: BoundaryContextState.COMPLETED },
      { from: BoundaryContextState.PROCESSING, to: BoundaryContextState.ERROR },
      { from: BoundaryContextState.COMPLETED, to: BoundaryContextState.IDLE },
      { from: BoundaryContextState.ERROR, to: BoundaryContextState.IDLE },
      { from: BoundaryContextState.IDLE, to: BoundaryContextState.TERMINATED },
    ];
  }

  getState(): BoundaryContextState {
    return this.currentState;
  }

  canTransition(to: BoundaryContextState): boolean {
    return this.transitions.some(
      (t) => t.from === this.currentState && t.to === to && (!t.guard || t.guard())
    );
  }

  transition(to: BoundaryContextState): void {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid transition: ${this.currentState} → ${to}`);
    }
    this.history.push({ from: this.currentState, to, timestamp: Date.now() });
    this.currentState = to;
  }

  getHistory(): ReadonlyArray<{ from: BoundaryContextState; to: BoundaryContextState; timestamp: number }> {
    return [...this.history];
  }

  reset(): void {
    if (this.currentState === BoundaryContextState.ERROR || this.currentState === BoundaryContextState.COMPLETED) {
      this.transition(BoundaryContextState.IDLE);
    }
  }
}
