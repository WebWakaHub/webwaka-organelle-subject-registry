/**
 * BoundaryContext — Observability Interface
 * Organelle: ORG-TB-BOUNDARY_CONTEXT-v0.1.0
 */

import { TelemetryData, OperationMetrics } from "./types";

export interface IBoundaryContextObservability {
  log(level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, data?: Record<string, unknown>): void;
  recordMetric(name: string, value: number): void;
  createSpan(name: string): { end: () => void };
  getTelemetry(): TelemetryData;
}

export class DefaultBoundaryContextObservability implements IBoundaryContextObservability {
  private readonly logs: Array<{ level: string; message: string; timestamp: number; data?: Record<string, unknown> }>;
  private readonly metrics: Map<string, number[]>;
  private readonly organelleId: string;

  constructor(organelleId: string) {
    this.organelleId = organelleId;
    this.logs = [];
    this.metrics = new Map();
  }

  log(level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, data?: Record<string, unknown>): void {
    this.logs.push({ level, message, timestamp: Date.now(), data });
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  createSpan(name: string): { end: () => void } {
    const start = Date.now();
    this.log("DEBUG", `Span started: ${name}`);
    return {
      end: () => {
        const duration = Date.now() - start;
        this.recordMetric(`span.${name}.duration`, duration);
        this.log("DEBUG", `Span ended: ${name} (${duration}ms)`);
      },
    };
  }

  getTelemetry(): TelemetryData {
    return {
      organelleId: this.organelleId,
      state: "IDLE" as any,
      metrics: {
        totalOperations: 0,
        successCount: 0,
        errorCount: 0,
        averageDuration: 0,
        lastOperationAt: Date.now(),
      },
      timestamp: Date.now(),
    };
  }

  getLogCount(): number {
    return this.logs.length;
  }
}
