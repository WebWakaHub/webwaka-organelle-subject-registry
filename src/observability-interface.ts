/**
 * Subject Registry Organelle - Observability Interface
 * 
 * Abstract observability interface for metrics, logs, and traces.
 * 
 * Constitutional Reference:
 * - SUBJECT_REGISTRY_ORGANELLE_DESIGN.md Section 8 (Observability Mapping)
 */

import { SubjectRegistryErrorCode } from './types';

/**
 * Metric Type
 */
export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
}

/**
 * Log Level
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  ERROR = 'ERROR',
}

/**
 * Observability Interface
 * 
 * Defines the abstract operations for metrics, logs, and traces.
 * Implementations are technology-agnostic.
 */
export interface ISubjectObservability {
  /**
   * Record a metric
   * 
   * @param name - Metric name
   * @param type - Metric type (counter or gauge)
   * @param value - Metric value
   * @param labels - Optional labels for metric dimensions
   */
  recordMetric(
    name: string,
    type: MetricType,
    value: number,
    labels?: Record<string, string>
  ): void;

  /**
   * Log an entry
   * 
   * @param level - Log level
   * @param message - Log message
   * @param fields - Optional structured fields
   */
  log(
    level: LogLevel,
    message: string,
    fields?: Record<string, unknown>
  ): void;

  /**
   * Start a trace span
   * 
   * @param operation_name - Name of the operation being traced
   * @param fields - Optional fields for the span
   * @returns Span ID for ending the span
   */
  startTrace(
    operation_name: string,
    fields?: Record<string, unknown>
  ): string;

  /**
   * End a trace span
   * 
   * @param span_id - Span ID returned from startTrace
   * @param success - Whether the operation succeeded
   * @param error_code - Optional error code if operation failed
   */
  endTrace(
    span_id: string,
    success: boolean,
    error_code?: SubjectRegistryErrorCode
  ): void;
}
