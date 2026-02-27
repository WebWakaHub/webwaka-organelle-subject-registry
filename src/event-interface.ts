/**
 * BoundaryContext — Event Interface
 * Organelle: ORG-TB-BOUNDARY_CONTEXT-v0.1.0
 */

import { BoundaryContextEvent } from "./types";

type EventHandler = (event: BoundaryContextEvent) => void;

export interface IBoundaryContextEvents {
  emit(event: BoundaryContextEvent): void;
  subscribe(handler: EventHandler): () => void;
  getEventCount(): number;
}

export class BoundaryContextEventBus implements IBoundaryContextEvents {
  private readonly handlers: Set<EventHandler>;
  private eventCount: number;
  private readonly eventLog: BoundaryContextEvent[];

  constructor() {
    this.handlers = new Set();
    this.eventCount = 0;
    this.eventLog = [];
  }

  emit(event: BoundaryContextEvent): void {
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

  getEventLog(): ReadonlyArray<BoundaryContextEvent> {
    return [...this.eventLog];
  }
}
