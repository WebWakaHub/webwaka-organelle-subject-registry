import { TelemetryData, OperationMetrics } from "./types";

export interface ISubjectRegistryObservability {
  log(level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, data?: Record<string, unknown>): void;
  recordMetric(name: string, value: number): void;
  createSpan(name: string): { end: () => void };
  getTelemetry(): TelemetryData;
}

export class DefaultSubjectRegistryObservability implements ISubjectRegistryObservability {
  private readonly logs: Array<{ level: string; message: string; timestamp: number }>;
  private readonly metrics: Map<string, number[]>;
  private readonly organelleId: string;
  constructor(organelleId: string) { this.organelleId = organelleId; this.logs = []; this.metrics = new Map(); }
  log(level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, data?: Record<string, unknown>): void { this.logs.push({ level, message, timestamp: Date.now() }); }
  recordMetric(name: string, value: number): void { if (!this.metrics.has(name)) this.metrics.set(name, []); this.metrics.get(name)!.push(value); }
  createSpan(name: string): { end: () => void } { const start = Date.now(); return { end: () => { this.recordMetric(`span.${name}.duration`, Date.now() - start); } }; }
  getTelemetry(): TelemetryData { return { organelleId: this.organelleId, state: "IDLE" as any, metrics: { totalOperations: 0, successCount: 0, errorCount: 0, averageDuration: 0, lastOperationAt: Date.now() }, timestamp: Date.now() }; }
}
