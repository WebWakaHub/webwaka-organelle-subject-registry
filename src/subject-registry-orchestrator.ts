/**
 * SubjectRegistry — Orchestrator (Main Entry Point)
 * Organelle: ORG-IA-SUBJECT_REGISTRY-v0.1.0
 */

import {
  SubjectRegistryConfig,
  SubjectRegistryState,
  SubjectRegistryCommand,
  SubjectRegistryResult,
  SubjectRegistryQuery,
  SubjectRegistryQueryResult,
  SubjectRegistryEvent,
  OperationMetrics,
  TelemetryData,
} from "./types";
import { SubjectRegistryEntity } from "./subject-registry-entity";
import { SubjectRegistryStateMachine } from "./state-machine";
import { ISubjectRegistryStorage, InMemorySubjectRegistryStorage } from "./storage-interface";
import { ISubjectRegistryEvents, SubjectRegistryEventBus } from "./event-interface";
import { ISubjectRegistryObservability, DefaultSubjectRegistryObservability } from "./observability-interface";

export class SubjectRegistryOrchestrator {
  private entity: SubjectRegistryEntity;
  private stateMachine: SubjectRegistryStateMachine;
  private storage: ISubjectRegistryStorage;
  private events: ISubjectRegistryEvents;
  private observability: ISubjectRegistryObservability;

  constructor(
    config: SubjectRegistryConfig,
    storage?: ISubjectRegistryStorage,
    events?: ISubjectRegistryEvents,
    observability?: ISubjectRegistryObservability,
  ) {
    this.entity = new SubjectRegistryEntity(config);
    this.stateMachine = new SubjectRegistryStateMachine();
    this.storage = storage ?? new InMemorySubjectRegistryStorage();
    this.events = events ?? new SubjectRegistryEventBus();
    this.observability = observability ?? new DefaultSubjectRegistryObservability(config.id);

    this.observability.log("INFO", `SubjectRegistry orchestrator initialized`, { id: config.id });
  }

  async execute(command: SubjectRegistryCommand): Promise<SubjectRegistryResult> {
    const span = this.observability.createSpan("execute");
    this.observability.log("INFO", `Executing command: ${command.type}`, { correlationId: command.correlationId });

    try {
      const result = this.entity.execute(command);

      // Persist state
      await this.storage.save(this.entity.getId(), this.entity.toSnapshot());

      // Emit event
      this.events.emit({
        type: `SubjectRegistry.${command.type}.${result.success ? "SUCCESS" : "FAILURE"}`,
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

  query(query: SubjectRegistryQuery): SubjectRegistryQueryResult {
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

  getState(): SubjectRegistryState {
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
      this.observability.log("INFO", "SubjectRegistry terminated");
    } finally {
      span.end();
    }
  }
}
