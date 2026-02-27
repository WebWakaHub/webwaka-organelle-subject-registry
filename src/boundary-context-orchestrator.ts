/**
 * BoundaryContext — Orchestrator (Main Entry Point)
 * Organelle: ORG-TB-BOUNDARY_CONTEXT-v0.1.0
 */

import {
  BoundaryContextConfig,
  BoundaryContextState,
  BoundaryContextCommand,
  BoundaryContextResult,
  BoundaryContextQuery,
  BoundaryContextQueryResult,
  BoundaryContextEvent,
  OperationMetrics,
  TelemetryData,
} from "./types";
import { BoundaryContextEntity } from "./boundary-context-entity";
import { BoundaryContextStateMachine } from "./state-machine";
import { IBoundaryContextStorage, InMemoryBoundaryContextStorage } from "./storage-interface";
import { IBoundaryContextEvents, BoundaryContextEventBus } from "./event-interface";
import { IBoundaryContextObservability, DefaultBoundaryContextObservability } from "./observability-interface";

export class BoundaryContextOrchestrator {
  private entity: BoundaryContextEntity;
  private stateMachine: BoundaryContextStateMachine;
  private storage: IBoundaryContextStorage;
  private events: IBoundaryContextEvents;
  private observability: IBoundaryContextObservability;

  constructor(
    config: BoundaryContextConfig,
    storage?: IBoundaryContextStorage,
    events?: IBoundaryContextEvents,
    observability?: IBoundaryContextObservability,
  ) {
    this.entity = new BoundaryContextEntity(config);
    this.stateMachine = new BoundaryContextStateMachine();
    this.storage = storage ?? new InMemoryBoundaryContextStorage();
    this.events = events ?? new BoundaryContextEventBus();
    this.observability = observability ?? new DefaultBoundaryContextObservability(config.id);

    this.observability.log("INFO", `BoundaryContext orchestrator initialized`, { id: config.id });
  }

  async execute(command: BoundaryContextCommand): Promise<BoundaryContextResult> {
    const span = this.observability.createSpan("execute");
    this.observability.log("INFO", `Executing command: ${command.type}`, { correlationId: command.correlationId });

    try {
      const result = this.entity.execute(command);

      // Persist state
      await this.storage.save(this.entity.getId(), this.entity.toSnapshot());

      // Emit event
      this.events.emit({
        type: `BoundaryContext.${command.type}.${result.success ? "SUCCESS" : "FAILURE"}`,
        source: this.entity.getId(),
        data: { command: command.type, success: result.success },
        timestamp: Date.now(),
        correlationId: command.correlationId,
      });

      this.observability.recordMetric("command.duration", result.duration);
      return result;
    } finally {
      span.end();
    }
  }

  query(query: BoundaryContextQuery): BoundaryContextQueryResult {
    const span = this.observability.createSpan("query");
    try {
      return {
        data: {
          state: this.entity.getState(),
          metrics: this.entity.getMetrics(),
          snapshot: this.entity.toSnapshot(),
        },
        timestamp: Date.now(),
      };
    } finally {
      span.end();
    }
  }

  getState(): BoundaryContextState {
    return this.entity.getState();
  }

  getMetrics(): OperationMetrics {
    return this.entity.getMetrics();
  }

  getTelemetry(): TelemetryData {
    return {
      organelleId: this.entity.getId(),
      state: this.entity.getState(),
      metrics: this.entity.getMetrics(),
      timestamp: Date.now(),
    };
  }

  async reset(): Promise<void> {
    this.observability.log("INFO", "Resetting organelle");
    this.stateMachine.reset();
  }

  async terminate(): Promise<void> {
    const span = this.observability.createSpan("terminate");
    try {
      this.observability.log("INFO", "BoundaryContext terminated");
    } finally {
      span.end();
    }
  }
}
