/**
 * Subject Registry Organelle - Type Definitions
 * 
 * Layer: Organelle
 * Category: Identity & Access
 * Version: 0.1.0
 * 
 * Constitutional Reference:
 * - P0-T01: Define organelle purpose and responsibilities
 * - P0-T02: Document canonical inputs and outputs
 * - P0-T03: Declare invariants and constraints
 * - P1-T02: Define interface contracts
 */

/**
 * Subject Type Enumeration
 * 
 * Defines the structural classification of subjects within the platform.
 * This is a structural classification, not a business-domain classification.
 * Subject type is immutable after creation (INV-SR-004).
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
 * ARCHIVED and DELETED are terminal states (INV-SR-009).
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
 * Constraints (CON-SR-005):
 * - Keys must be strings
 * - Values must be primitive types (string, number, boolean)
 * - No nested objects or arrays
 * - No sensitive data (passwords, tokens, credentials)
 * - No permission or role data
 * - No tenancy data
 */
export type SubjectAttributes = Record<string, string | number | boolean>;

/**
 * Requesting Context
 * 
 * Provides audit trail information about who initiated the operation.
 */
export interface RequestingContext {
  /** Identifier of the system or service initiating the request */
  source_system: string;
  /** ISO 8601 UTC timestamp of when the request was initiated */
  timestamp: string;
}

/**
 * Subject Record
 * 
 * The core entity representing a subject in the platform.
 * Immutable fields: subject_id (INV-SR-001), subject_type (INV-SR-004), created_at (INV-SR-005)
 */
export interface SubjectRecord {
  /** Globally unique, immutable identifier (UUID v4). INV-SR-001, INV-SR-002 */
  subject_id: string;
  /** Type classification of the subject. Immutable after creation. INV-SR-003, INV-SR-004 */
  subject_type: SubjectType;
  /** Current lifecycle status */
  status: SubjectStatus;
  /** Structural identity attributes */
  attributes: SubjectAttributes;
  /** Timestamp of subject creation (immutable, UTC). INV-SR-005 */
  created_at: Date;
  /** Timestamp of last update (UTC). INV-SR-007 */
  updated_at: Date;
  /** Record version for optimistic concurrency control. INV-SR-006 */
  version: number;
}

/**
 * Subject Registration Request
 */
export interface RegisterSubjectRequest {
  subject_type: SubjectType;
  attributes?: SubjectAttributes;
  requesting_context: RequestingContext;
  /** Optional idempotency key for safe retry of registration */
  idempotency_key?: string;
}

/**
 * Subject Status Update Request
 */
export interface UpdateSubjectStatusRequest {
  subject_id: string;
  new_status: SubjectStatus;
  reason?: string;
  requesting_context: RequestingContext;
  /** Must match current record version. INV-SR-011 */
  expected_version: number;
}

/**
 * Subject Attributes Update Request
 */
export interface UpdateSubjectAttributesRequest {
  subject_id: string;
  attributes: SubjectAttributes;
  requesting_context: RequestingContext;
  /** Must match current record version. INV-SR-011 */
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
 * 
 * Canonical error codes as defined in P0-T02 §3.1.2.
 */
export enum SubjectRegistryErrorCode {
  /** Subject ID already exists */
  SUBJECT_ID_COLLISION = 'SUBJECT_ID_COLLISION',
  /** Invalid subject type value */
  INVALID_SUBJECT_TYPE = 'INVALID_SUBJECT_TYPE',
  /** Subject not found by ID */
  SUBJECT_NOT_FOUND = 'SUBJECT_NOT_FOUND',
  /** Invalid status transition per state machine */
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  /** expected_version does not match current version */
  CONCURRENT_MODIFICATION_CONFLICT = 'CONCURRENT_MODIFICATION_CONFLICT',
  /** Attributes contain invalid types or prohibited keys */
  INVALID_ATTRIBUTES = 'INVALID_ATTRIBUTES',
  /** Attempted mutation on a terminal state subject */
  TERMINAL_STATE_MUTATION = 'TERMINAL_STATE_MUTATION',
  /** Attempted modification of an immutable field */
  IMMUTABLE_FIELD_VIOLATION = 'IMMUTABLE_FIELD_VIOLATION',
}

/**
 * Subject Registry Error
 */
export class SubjectRegistryError extends Error {
  constructor(
    public readonly code: SubjectRegistryErrorCode,
    message: string,
    public readonly subject_id?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SubjectRegistryError';
  }
}
