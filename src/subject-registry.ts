/**
 * Subject Registry Organelle - Main Orchestrator
 * 
 * Coordinates subject registration, status updates, attribute updates,
 * and subject lookup. Enforces all invariants and constraints.
 * 
 * Constitutional Reference:
 * - P0-T01: Define organelle purpose and responsibilities
 * - P0-T02: Document canonical inputs and outputs
 * - P0-T03: Declare invariants and constraints
 * - P1-T01: Design state machine model
 * - P1-T02: Define interface contracts
 * - P1-T03: Create architectural diagrams
 */

import {
  SubjectRecord,
  SubjectStatus,
  RegisterSubjectRequest,
  UpdateSubjectStatusRequest,
  UpdateSubjectAttributesRequest,
  GetSubjectRequest,
  SubjectRegistryError,
  SubjectRegistryErrorCode,
} from './types';
import {
  createSubjectRecord,
  validateSubjectStatus,
  validateSubjectAttributes,
  ensureSubjectNotInTerminalState,
} from './subject-entity';
import { isValidTransition, isTerminalState } from './state-machine';
import { ISubjectStorage } from './storage-interface';
import { ISubjectEventEmitter, SubjectEvent } from './event-interface';
import { ISubjectObservability, MetricType, LogLevel } from './observability-interface';

/**
 * ISubjectRegistry Interface
 * 
 * The primary interface contract as defined in P1-T02.
 * All consumers interact exclusively through this interface.
 */
export interface ISubjectRegistry {
  registerSubject(request: RegisterSubjectRequest): Promise<SubjectRecord>;
  updateSubjectStatus(request: UpdateSubjectStatusRequest): Promise<SubjectRecord>;
  updateSubjectAttributes(request: UpdateSubjectAttributesRequest): Promise<SubjectRecord>;
  getSubject(request: GetSubjectRequest): Promise<SubjectRecord>;
}

/**
 * Subject Registry Organelle — Implementation
 * 
 * Main orchestrator for subject registration and lifecycle management.
 * Dependencies are injected at the Cell layer (Dependency Inversion Principle).
 */
export class SubjectRegistry implements ISubjectRegistry {
  constructor(
    private readonly storage: ISubjectStorage,
    private readonly eventEmitter: ISubjectEventEmitter,
    private readonly observability: ISubjectObservability
  ) {}

  /**
   * Register a new subject in the platform.
   * 
   * Flow (per P1-T03 §4 Registration Sequence):
   * 1. Validate request fields
   * 2. Create SubjectEntity (UUID, ACTIVE, version=1)
   * 3. Persist via ISubjectStorage.create()
   * 4. On success: emit SubjectCreatedEvent
   * 5. On collision: return SUBJECT_ID_COLLISION
   * 
   * @param request - Registration request
   * @returns Newly created subject record
   */
  async registerSubject(request: RegisterSubjectRequest): Promise<SubjectRecord> {
    const span_id = this.observability.startTrace('registerSubject', {
      subject_type: request.subject_type,
      idempotency_key: request.idempotency_key,
    });

    try {
      // Step 1: Create subject record (validates type and attributes internally)
      const subject = createSubjectRecord(
        request.subject_type,
        request.attributes
      );

      // Step 2: Persist via storage
      const result = await this.storage.storeSubject(subject);
      if (!result.success) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.SUBJECT_ID_COLLISION,
          `Subject ID collision during registration`,
          subject.subject_id
        );
      }

      // Step 3: Emit SubjectCreatedEvent AFTER successful persistence (INV-SR-012)
      const event: SubjectEvent = {
        event_id: this.generateEventId(),
        event_type: 'SubjectCreated',
        subject_id: subject.subject_id,
        timestamp: new Date(),
        payload: {
          subject_id: subject.subject_id,
          subject_type: subject.subject_type,
          status: subject.status,
          attributes: subject.attributes,
          created_at: subject.created_at,
        },
      };
      await this.eventEmitter.emit(event);

      // Step 4: Record metrics and log
      this.observability.recordMetric('subject.registered', MetricType.COUNTER, 1, {
        subject_type: request.subject_type,
      });
      this.observability.log(LogLevel.INFO, 'Subject registered successfully', {
        subject_id: subject.subject_id,
        subject_type: subject.subject_type,
        version: subject.version,
      });

      this.observability.endTrace(span_id, true);
      return subject;
    } catch (error) {
      this.handleError(span_id, error);
      throw error;
    }
  }

  /**
   * Update the lifecycle status of an existing subject.
   * 
   * Guard Evaluation Order (per P1-T01 §5.4):
   * 1. Terminal State Guard — TERMINAL_STATE_MUTATION
   * 2. State Validity Guard — INVALID_STATUS_TRANSITION
   * 3. Optimistic Concurrency Guard — CONCURRENT_MODIFICATION_CONFLICT
   * 
   * @param request - Status update request
   * @returns Updated subject record
   */
  async updateSubjectStatus(
    request: UpdateSubjectStatusRequest
  ): Promise<SubjectRecord> {
    const span_id = this.observability.startTrace('updateSubjectStatus', {
      subject_id: request.subject_id,
      new_status: request.new_status,
    });

    try {
      // Validate the new status value
      validateSubjectStatus(request.new_status);

      // Retrieve current subject
      const current_subject = await this.retrieveOrThrow(request.subject_id);

      // Guard 1: Terminal State Guard (highest priority — INV-SR-009, INV-SR-010)
      ensureSubjectNotInTerminalState(current_subject);

      // Guard 2: State Validity Guard (INV-SR-008)
      if (!isValidTransition(current_subject.status, request.new_status)) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.INVALID_STATUS_TRANSITION,
          `Invalid status transition: ${current_subject.status} → ${request.new_status}`,
          request.subject_id
        );
      }

      // Build updated record (INV-SR-006: version+1, INV-SR-007: updated_at=now)
      const updated_subject: SubjectRecord = {
        ...current_subject,
        status: request.new_status,
        updated_at: new Date(),
        version: current_subject.version + 1,
      };

      // Guard 3: Optimistic Concurrency Guard (INV-SR-011)
      const update_result = await this.storage.updateSubject(
        request.subject_id,
        request.expected_version,
        updated_subject
      );

      if (!update_result.success || update_result.data?.version_mismatch) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.CONCURRENT_MODIFICATION_CONFLICT,
          `Concurrent modification conflict. Expected version ${request.expected_version}, current version may differ.`,
          request.subject_id
        );
      }

      // Emit events AFTER successful persistence (INV-SR-012)
      // Always emit SubjectStatusChangedEvent
      const status_event: SubjectEvent = {
        event_id: this.generateEventId(),
        event_type: 'SubjectStatusChanged',
        subject_id: updated_subject.subject_id,
        timestamp: new Date(),
        payload: {
          subject_id: updated_subject.subject_id,
          old_status: current_subject.status,
          new_status: updated_subject.status,
          reason: request.reason,
          changed_at: updated_subject.updated_at,
        },
      };
      await this.eventEmitter.emit(status_event);

      // Emit terminal state convenience events (per P1-T01 §6.2)
      if (updated_subject.status === SubjectStatus.ARCHIVED) {
        const archived_event: SubjectEvent = {
          event_id: this.generateEventId(),
          event_type: 'SubjectArchived',
          subject_id: updated_subject.subject_id,
          timestamp: new Date(),
          payload: {
            subject_id: updated_subject.subject_id,
            archived_at: updated_subject.updated_at,
          },
        };
        await this.eventEmitter.emit(archived_event);
      } else if (updated_subject.status === SubjectStatus.DELETED) {
        const deleted_event: SubjectEvent = {
          event_id: this.generateEventId(),
          event_type: 'SubjectDeleted',
          subject_id: updated_subject.subject_id,
          timestamp: new Date(),
          payload: {
            subject_id: updated_subject.subject_id,
            deleted_at: updated_subject.updated_at,
          },
        };
        await this.eventEmitter.emit(deleted_event);
      }

      // Record metrics
      this.observability.recordMetric('subject.status_changed', MetricType.COUNTER, 1, {
        old_status: current_subject.status,
        new_status: updated_subject.status,
      });
      this.observability.log(LogLevel.INFO, 'Subject status updated', {
        subject_id: updated_subject.subject_id,
        old_status: current_subject.status,
        new_status: updated_subject.status,
        version: updated_subject.version,
      });

      this.observability.endTrace(span_id, true);
      return updated_subject;
    } catch (error) {
      this.handleError(span_id, error);
      throw error;
    }
  }

  /**
   * Update the structural identity attributes of an existing subject.
   * 
   * @param request - Attributes update request
   * @returns Updated subject record
   */
  async updateSubjectAttributes(
    request: UpdateSubjectAttributesRequest
  ): Promise<SubjectRecord> {
    const span_id = this.observability.startTrace('updateSubjectAttributes', {
      subject_id: request.subject_id,
    });

    try {
      // Validate attributes (CON-SR-005)
      validateSubjectAttributes(request.attributes);

      // Retrieve current subject
      const current_subject = await this.retrieveOrThrow(request.subject_id);

      // Guard 1: Terminal State Guard (INV-SR-009, INV-SR-010)
      ensureSubjectNotInTerminalState(current_subject);

      // Build updated record (INV-SR-006: version+1, INV-SR-007: updated_at=now)
      const updated_subject: SubjectRecord = {
        ...current_subject,
        attributes: { ...request.attributes }, // Defensive copy
        updated_at: new Date(),
        version: current_subject.version + 1,
      };

      // Guard 2: Optimistic Concurrency Guard (INV-SR-011)
      const update_result = await this.storage.updateSubject(
        request.subject_id,
        request.expected_version,
        updated_subject
      );

      if (!update_result.success || update_result.data?.version_mismatch) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.CONCURRENT_MODIFICATION_CONFLICT,
          `Concurrent modification conflict. Expected version ${request.expected_version}, current version may differ.`,
          request.subject_id
        );
      }

      // Emit event AFTER successful persistence (INV-SR-012)
      const event: SubjectEvent = {
        event_id: this.generateEventId(),
        event_type: 'SubjectAttributesUpdated',
        subject_id: updated_subject.subject_id,
        timestamp: new Date(),
        payload: {
          subject_id: updated_subject.subject_id,
          updated_attributes: updated_subject.attributes,
          updated_at: updated_subject.updated_at,
        },
      };
      await this.eventEmitter.emit(event);

      // Record metrics
      this.observability.recordMetric('subject.attributes_updated', MetricType.COUNTER, 1);
      this.observability.log(LogLevel.INFO, 'Subject attributes updated', {
        subject_id: updated_subject.subject_id,
        version: updated_subject.version,
      });

      this.observability.endTrace(span_id, true);
      return updated_subject;
    } catch (error) {
      this.handleError(span_id, error);
      throw error;
    }
  }

  /**
   * Retrieve a subject record by Subject ID.
   * 
   * @param request - Get subject request
   * @returns Subject record if found
   */
  async getSubject(request: GetSubjectRequest): Promise<SubjectRecord> {
    const span_id = this.observability.startTrace('getSubject', {
      subject_id: request.subject_id,
    });

    try {
      const subject = await this.retrieveOrThrow(request.subject_id);

      this.observability.recordMetric('subject.lookup', MetricType.COUNTER, 1);
      this.observability.endTrace(span_id, true);
      return subject;
    } catch (error) {
      this.handleError(span_id, error);
      throw error;
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  /**
   * Retrieve a subject or throw SUBJECT_NOT_FOUND.
   */
  private async retrieveOrThrow(subject_id: string): Promise<SubjectRecord> {
    const result = await this.storage.retrieveSubject(subject_id);
    if (!result.success || !result.data) {
      throw new SubjectRegistryError(
        SubjectRegistryErrorCode.SUBJECT_NOT_FOUND,
        `Subject not found: ${subject_id}`,
        subject_id
      );
    }
    return result.data;
  }

  /**
   * Generate a unique event ID for lifecycle events.
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Handle errors consistently across all operations.
   */
  private handleError(span_id: string, error: unknown): void {
    const error_code =
      error instanceof SubjectRegistryError
        ? error.code
        : undefined;

    this.observability.log(LogLevel.ERROR, 'Operation failed', {
      error_code,
      message: error instanceof Error ? error.message : String(error),
    });
    this.observability.endTrace(span_id, false, error_code);
  }
}
