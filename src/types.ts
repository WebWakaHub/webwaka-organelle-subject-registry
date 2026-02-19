/**
 * Subject Registry Organelle - Type Definitions
 * 
 * Layer: Organelle
 * Category: Identity & Access
 * Version: 0.1.0
 * 
 * Constitutional Reference:
 * - SUBJECT_REGISTRY_ORGANELLE.md (Specification)
 * - SUBJECT_REGISTRY_ORGANELLE_DESIGN.md (Design)
 * - SUBJECT_REGISTRY_ORGANELLE_VALIDATION.md (Validation)
 */

/**
 * Subject Type Enumeration
 * 
 * Defines the classification of subjects within the system.
 * This is a structural classification, not a business-domain classification.
 */
export enum SubjectType {
  USER = 'USER',
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT',
  API_CLIENT = 'API_CLIENT',
  SYSTEM_PROCESS = 'SYSTEM_PROCESS',
}

/**
 * Subject Status Enumeration
 * 
 * Defines the lifecycle status of a subject.
 * ARCHIVED and DELETED are terminal states.
 */
export enum SubjectStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

/**
 * Subject Attributes
 * 
 * Flexible key-value map for storing structural identity attributes.
 * 
 * Constraints:
 * - Keys must be strings
 * - Values must be primitive types (string, number, boolean)
 * - No nested objects or arrays
 * - No sensitive data (passwords, tokens, credentials)
 * - No permission or role data
 * - No tenancy data
 * - No relationship data
 */
export type SubjectAttributes = Record<string, string | number | boolean>;

/**
 * Subject Record
 * 
 * The core entity representing a subject in the system.
 */
export interface SubjectRecord {
  /** Globally unique, immutable identifier for the subject */
  subject_id: string;

  /** Type classification of the subject */
  subject_type: SubjectType;

  /** Current lifecycle status */
  status: SubjectStatus;

  /** Structural identity attributes (optional) */
  attributes: SubjectAttributes;

  /** Timestamp of subject creation (immutable, UTC) */
  created_at: Date;

  /** Timestamp of last update (UTC) */
  updated_at: Date;

  /** Record version for optimistic concurrency control */
  version: number;
}

/**
 * Subject Registration Request
 */
export interface RegisterSubjectRequest {
  subject_type: SubjectType;
  attributes?: SubjectAttributes;
}

/**
 * Subject Status Update Request
 */
export interface UpdateSubjectStatusRequest {
  subject_id: string;
  new_status: SubjectStatus;
  reason?: string;
  expected_version: number;
}

/**
 * Subject Attributes Update Request
 */
export interface UpdateSubjectAttributesRequest {
  subject_id: string;
  attributes: SubjectAttributes;
  expected_version: number;
}

/**
 * Subject Lookup Request
 */
export interface GetSubjectRequest {
  subject_id: string;
}

/**
 * Error Codes
 */
export enum SubjectRegistryErrorCode {
  SUBJECT_NOT_FOUND = 'SUBJECT_NOT_FOUND',
  SUBJECT_ID_COLLISION = 'SUBJECT_ID_COLLISION',
  INVALID_SUBJECT_TYPE = 'INVALID_SUBJECT_TYPE',
  INVALID_STATUS = 'INVALID_STATUS',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  CONCURRENT_MODIFICATION_CONFLICT = 'CONCURRENT_MODIFICATION_CONFLICT',
  IMMUTABLE_FIELD_VIOLATION = 'IMMUTABLE_FIELD_VIOLATION',
  VERSION_MONOTONICITY_VIOLATION = 'VERSION_MONOTONICITY_VIOLATION',
  PROHIBITED_ATTRIBUTE = 'PROHIBITED_ATTRIBUTE',
  INVALID_ATTRIBUTE_TYPE = 'INVALID_ATTRIBUTE_TYPE',
  CROSS_CATEGORY_DEPENDENCY_VIOLATION = 'CROSS_CATEGORY_DEPENDENCY_VIOLATION',
  BUSINESS_SEMANTICS_VIOLATION = 'BUSINESS_SEMANTICS_VIOLATION',
  TERMINAL_STATE_MUTATION_PROHIBITED = 'TERMINAL_STATE_MUTATION_PROHIBITED',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
}

/**
 * Subject Registry Error
 */
export class SubjectRegistryError extends Error {
  constructor(
    public readonly code: SubjectRegistryErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SubjectRegistryError';
  }
}
