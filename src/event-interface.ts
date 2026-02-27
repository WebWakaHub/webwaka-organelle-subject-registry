/**
 * SubjectRegistry — Event Interface
 * Organelle: ORG-IA-SUBJECT_REGISTRY-v0.1.0
 */

import { SubjectRegistryEvent } from "./types";

type EventHandler = (event: SubjectRegistryEvent) => void;

export interface ISubjectRegistryEvents {
  emit(event: SubjectRegistryEvent): void;
  subscribe(handler: EventHandler): () => void;
  getEventCount(): number;
}

export class SubjectRegistryEventBus implements ISubjectRegistryEvents {
  private readonly handlers: Set<EventHandler>;
  private eventCount: number;
  private readonly eventLog: SubjectRegistryEvent[];

  constructor() {
    this.handlers = new Set();
    this.eventCount = 0;
    this.eventLog = [];
  }

  emit(event: SubjectRegistryEvent): void {
    this.eventCount++;
    this.eventLog.push(event);
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Event handler error:`, error);
      }
    }
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  getEventCount(): number {
    return this.eventCount;
  }

  getEventLog(): ReadonlyArray<SubjectRegistryEvent> {
    return [...this.eventLog];
  }
}
