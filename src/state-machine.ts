import { SubjectRegistryState } from "./types";

interface Transition { from: SubjectRegistryState; to: SubjectRegistryState; guard?: () => boolean; }

export class SubjectRegistryStateMachine {
  private currentState: SubjectRegistryState;
  private readonly transitions: Transition[];
  private readonly history: Array<{ from: SubjectRegistryState; to: SubjectRegistryState; timestamp: number }>;

  constructor(initialState: SubjectRegistryState = SubjectRegistryState.IDLE) {
    this.currentState = initialState;
    this.history = [];
    this.transitions = [
      { from: SubjectRegistryState.IDLE, to: SubjectRegistryState.PROCESSING },
      { from: SubjectRegistryState.PROCESSING, to: SubjectRegistryState.COMPLETED },
      { from: SubjectRegistryState.PROCESSING, to: SubjectRegistryState.ERROR },
      { from: SubjectRegistryState.COMPLETED, to: SubjectRegistryState.IDLE },
      { from: SubjectRegistryState.ERROR, to: SubjectRegistryState.IDLE },
      { from: SubjectRegistryState.IDLE, to: SubjectRegistryState.TERMINATED },
    ];
  }

  getState(): SubjectRegistryState { return this.currentState; }
  canTransition(to: SubjectRegistryState): boolean { return this.transitions.some(t => t.from === this.currentState && t.to === to && (!t.guard || t.guard())); }
  transition(to: SubjectRegistryState): void { if (!this.canTransition(to)) throw new Error(`Invalid: ${this.currentState} -> ${to}`); this.history.push({ from: this.currentState, to, timestamp: Date.now() }); this.currentState = to; }
  getHistory() { return [...this.history]; }
  reset(): void { if (this.currentState === SubjectRegistryState.ERROR || this.currentState === SubjectRegistryState.COMPLETED) this.transition(SubjectRegistryState.IDLE); }
}
