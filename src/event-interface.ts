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
  constructor() { this.handlers = new Set(); this.eventCount = 0; this.eventLog = []; }
  emit(event: SubjectRegistryEvent): void { this.eventCount++; this.eventLog.push(event); for (const h of this.handlers) { try { h(event); } catch (e) { console.error(e); } } }
  subscribe(handler: EventHandler): () => void { this.handlers.add(handler); return () => { this.handlers.delete(handler); }; }
  getEventCount(): number { return this.eventCount; }
  getEventLog(): ReadonlyArray<SubjectRegistryEvent> { return [...this.eventLog]; }
}
