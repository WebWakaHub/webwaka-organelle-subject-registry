/**
 * Subject Registry Organelle - Public API
 * 
 * Layer: Organelle
 * Category: Identity & Access
 * Version: 0.1.0
 * 
 * This is the single entry point for all consumers of the Subject Registry Organelle.
 */

// Main Organelle
export { SubjectRegistry, ISubjectRegistry } from './subject-registry';

// Types
export {
  SubjectType,
  SubjectStatus,
  SubjectAttributes,
  RequestingContext,
  SubjectRecord,
  RegisterSubjectRequest,
  UpdateSubjectStatusRequest,
  UpdateSubjectAttributesRequest,
  GetSubjectRequest,
  SubjectRegistryErrorCode,
  SubjectRegistryError,
} from './types';

// Interfaces (for Cell layer injection)
export { ISubjectStorage, StorageResult } from './storage-interface';
export {
  ISubjectEventEmitter,
  SubjectEvent,
  SubjectCreatedEvent,
  SubjectStatusChangedEvent,
  SubjectAttributesUpdatedEvent,
  SubjectArchivedEvent,
  SubjectDeletedEvent,
} from './event-interface';
export { ISubjectObservability, MetricType, LogLevel } from './observability-interface';

// State Machine (for testing and validation)
export { isValidTransition, isTerminalState, getInitialStatus } from './state-machine';

// Entity Utilities (for testing and validation)
export {
  validateSubjectType,
  validateSubjectStatus,
  validateSubjectAttributes,
  ensureSubjectNotInTerminalState,
  generateSubjectId,
  createSubjectRecord,
} from './subject-entity';
