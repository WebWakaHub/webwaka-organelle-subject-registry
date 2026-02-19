/**
 * Subject Registry Organelle - Main Orchestrator
 * 
 * Coordinates subject registration, status updates, and lifecycle management.
 * 
 * Constitutional Reference:
 * - SUBJECT_REGISTRY_ORGANELLE.md (Complete Specification)
 * - SUBJECT_REGISTRY_ORGANELLE_DESIGN.md (Complete Design)
 */

import {
  SubjectRecord,
  SubjectType,
  SubjectStatus,
  SubjectAttributes,
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
 * Subject Registry Organelle
 * 
 * Main orchestrator for subject registration and lifecycle management.
 */
export class SubjectRegistry {
  constructor(
    private readonly storage: ISubjectStorage,
    private readonly eventEmitter: ISubjectEventEmitter,
    private readonly observability: ISubjectObservability
  ) {}

  /**
   * Register a new subject
   * 
   * @param request - Registration request
   * @returns Newly created subject record
   */
  async registerSubject(request: RegisterSubjectRequest): Promise<SubjectRecord> {
    const span_id = this.observability.startTrace('registerSubject', {
      subject_type: request.subject_type,
    });

    try {
      // Create subject record
      const subject = createSubjectRecord(request.subject_type, request.attributes);

      // Store subject
      const result = await this.storage.storeSubject(subject);
      if (!result.success) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.SUBJECT_ID_COLLISION,
          `Failed to store subject: ${result.error}`
        );
      }

      // Emit event
      const event: SubjectEvent = {
        event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

      // Record metrics
      this.observability.recordMetric(
        'subject_registered',
        MetricType.COUNTER,
        1,
        { subject_type: request.subject_type }
      );

      this.observability.log(LogLevel.INFO, 'Subject registered', {
        subject_id: subject.subject_id,
        subject_type: subject.subject_type,
      });

      this.observability.endTrace(span_id, true);
      return subject;
    } catch (error) {
      const error_code =
        error instanceof SubjectRegistryError
          ? error.code
          : SubjectRegistryErrorCode.STORAGE_UNAVAILABLE;

      this.observability.endTrace(span_id, false, error_code);
      throw error;
    }
  }

  /**
   * Update subject status
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
      // Validate new status
      validateSubjectStatus(request.new_status);

      // Retrieve current subject
      const retrieve_result = await this.storage.retrieveSubject(request.subject_id);
      if (!retrieve_result.success || !retrieve_result.data) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.SUBJECT_NOT_FOUND,
          `Subject not found: ${request.subject_id}`
        );
      }

      const current_subject = retrieve_result.data;

      // Check if subject is in terminal state
      ensureSubjectNotInTerminalState(current_subject);

      // Validate state transition
      if (!isValidTransition(current_subject.status, request.new_status)) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.INVALID_STATUS_TRANSITION,
          `Invalid status transition: ${current_subject.status} -> ${request.new_status}`
        );
      }

      // No-op if status is the same
      if (current_subject.status === request.new_status) {
        this.observability.log(LogLevel.DEBUG, 'Status update is no-op', {
          subject_id: request.subject_id,
          status: request.new_status,
        });
        this.observability.endTrace(span_id, true);
        return current_subject;
      }

      // Update subject
      const updated_subject: SubjectRecord = {
        ...current_subject,
        status: request.new_status,
        updated_at: new Date(),
        version: current_subject.version + 1,
      };

      const update_result = await this.storage.updateSubject(
        request.subject_id,
        request.expected_version,
        updated_subject
      );

      if (!update_result.success || update_result.data?.version_mismatch) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.CONCURRENT_MODIFICATION_CONFLICT,
          `Concurrent modification detected for subject: ${request.subject_id}`
        );
      }

      // Emit event
      const event: SubjectEvent = {
        event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      await this.eventEmitter.emit(event);

      // Record metrics
      this.observability.recordMetric(
        'subject_status_updated',
        MetricType.COUNTER,
        1,
        {
          old_status: current_subject.status,
          new_status: updated_subject.status,
        }
      );

      this.observability.log(LogLevel.INFO, 'Subject status updated', {
        subject_id: updated_subject.subject_id,
        old_status: current_subject.status,
        new_status: updated_subject.status,
      });

      this.observability.endTrace(span_id, true);
      return updated_subject;
    } catch (error) {
      const error_code =
        error instanceof SubjectRegistryError
          ? error.code
          : SubjectRegistryErrorCode.STORAGE_UNAVAILABLE;

      this.observability.endTrace(span_id, false, error_code);
      throw error;
    }
  }

  /**
   * Update subject attributes
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
      // Validate attributes
      validateSubjectAttributes(request.attributes);

      // Retrieve current subject
      const retrieve_result = await this.storage.retrieveSubject(request.subject_id);
      if (!retrieve_result.success || !retrieve_result.data) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.SUBJECT_NOT_FOUND,
          `Subject not found: ${request.subject_id}`
        );
      }

      const current_subject = retrieve_result.data;

      // Check if subject is in terminal state
      ensureSubjectNotInTerminalState(current_subject);

      // Update subject
      const updated_subject: SubjectRecord = {
        ...current_subject,
        attributes: request.attributes,
        updated_at: new Date(),
        version: current_subject.version + 1,
      };

      const update_result = await this.storage.updateSubject(
        request.subject_id,
        request.expected_version,
        updated_subject
      );

      if (!update_result.success || update_result.data?.version_mismatch) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.CONCURRENT_MODIFICATION_CONFLICT,
          `Concurrent modification detected for subject: ${request.subject_id}`
        );
      }

      // Emit event
      const event: SubjectEvent = {
        event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      this.observability.recordMetric(
        'subject_attributes_updated',
        MetricType.COUNTER,
        1
      );

      this.observability.log(LogLevel.INFO, 'Subject attributes updated', {
        subject_id: updated_subject.subject_id,
      });

      this.observability.endTrace(span_id, true);
      return updated_subject;
    } catch (error) {
      const error_code =
        error instanceof SubjectRegistryError
          ? error.code
          : SubjectRegistryErrorCode.STORAGE_UNAVAILABLE;

      this.observability.endTrace(span_id, false, error_code);
      throw error;
    }
  }

  /**
   * Get subject by ID
   * 
   * @param request - Get subject request
   * @returns Subject record if found
   */
  async getSubject(request: GetSubjectRequest): Promise<SubjectRecord> {
    const span_id = this.observability.startTrace('getSubject', {
      subject_id: request.subject_id,
    });

    try {
      const result = await this.storage.retrieveSubject(request.subject_id);
      if (!result.success || !result.data) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.SUBJECT_NOT_FOUND,
          `Subject not found: ${request.subject_id}`
        );
      }

      this.observability.recordMetric('subject_retrieved', MetricType.COUNTER, 1);
      this.observability.endTrace(span_id, true);
      return result.data;
    } catch (error) {
      const error_code =
        error instanceof SubjectRegistryError
          ? error.code
          : SubjectRegistryErrorCode.STORAGE_UNAVAILABLE;

      this.observability.endTrace(span_id, false, error_code);
      throw error;
    }
  }
}
