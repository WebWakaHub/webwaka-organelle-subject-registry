/**
 * Subject Registry Organelle - Public API
 * 
 * Layer: Organelle
 * Category: Identity & Access
 * Version: 0.1.0
 */

// Main Organelle
export { SubjectRegistry } from './subject-registry';

// Types
export {
  SubjectType,
  SubjectStatus,
  SubjectAttributes,
  SubjectRecord,
  RegisterSubjectRequest,
  UpdateSubjectStatusRequest,
  UpdateSubjectAttributesRequest,
  GetSubjectRequest,
  SubjectRegistryErrorCode,
  SubjectRegistryError,
} from './types';

// Interfaces
export { ISubjectStorage, StorageResult } from './storage-interface';
export { ISubjectEventEmitter, SubjectEvent } from './event-interface';
export { ISubjectObservability, MetricType, LogLevel } from './observability-interface';

// State Machine
export { isValidTransition, isTerminalState, getInitialStatus } from './state-machine';

// Entity Utilities
export {
  validateSubjectType,
  validateSubjectStatus,
  validateSubjectAttributes,
  ensureSubjectNotInTerminalState,
  generateSubjectId,
  createSubjectRecord,
} from './subject-entity';
