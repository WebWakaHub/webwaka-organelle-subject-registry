/**
 * Subject Registry Organelle - Subject Entity
 * 
 * Domain model with structural invariant enforcement.
 * 
 * Constitutional Reference:
 * - P0-T03: Declare invariants and constraints
 * - P1-T01: Design state machine model
 * - P1-T02: Define interface contracts
 */

import {
  SubjectRecord,
  SubjectType,
  SubjectStatus,
  SubjectAttributes,
  SubjectRegistryError,
  SubjectRegistryErrorCode,
} from './types';
import { isTerminalState } from './state-machine';

/**
 * Prohibited attribute keys (CON-SR-005: No credential storage)
 * 
 * These keys are rejected during attribute validation to prevent
 * cross-category contamination and credential leakage.
 */
const PROHIBITED_ATTRIBUTE_PATTERNS: string[] = [
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'api_secret',
  'credential',
  'secret',
  'private_key',
  'ssn',
  'credit_card',
  'card_number',
  'cvv',
  'pin',
];

/**
 * Validate subject type (INV-SR-003: Subject Type Non-Nullability)
 * 
 * @param subject_type - Subject type to validate
 * @throws SubjectRegistryError if subject_type is null, empty, or not a valid enum value
 */
export function validateSubjectType(subject_type: SubjectType): void {
  if (subject_type === null || subject_type === undefined) {
    throw new SubjectRegistryError(
      SubjectRegistryErrorCode.INVALID_SUBJECT_TYPE,
      'Subject type must not be null or undefined'
    );
  }

  const valid_types = Object.values(SubjectType);
  if (!valid_types.includes(subject_type)) {
    throw new SubjectRegistryError(
      SubjectRegistryErrorCode.INVALID_SUBJECT_TYPE,
      `Invalid subject type: ${subject_type}. Valid types: ${valid_types.join(', ')}`
    );
  }
}

/**
 * Validate subject status
 * 
 * @param status - Status to validate
 * @throws SubjectRegistryError if status is not a valid enum value
 */
export function validateSubjectStatus(status: SubjectStatus): void {
  const valid_statuses = Object.values(SubjectStatus);
  if (!valid_statuses.includes(status)) {
    throw new SubjectRegistryError(
      SubjectRegistryErrorCode.INVALID_STATUS_TRANSITION,
      `Invalid subject status: ${status}. Valid statuses: ${valid_statuses.join(', ')}`
    );
  }
}

/**
 * Validate subject attributes (CON-SR-005: No Credential Storage)
 * 
 * Enforces:
 * - No prohibited attribute keys (credential patterns)
 * - Only primitive types (string, number, boolean)
 * - No null, undefined, object, or array values
 * 
 * @param attributes - Attributes to validate
 * @throws SubjectRegistryError if attributes contain invalid keys or types
 */
export function validateSubjectAttributes(attributes: SubjectAttributes): void {
  if (attributes === null || attributes === undefined) {
    return; // No attributes to validate
  }

  for (const [key, value] of Object.entries(attributes)) {
    // Check for prohibited keys (case-insensitive)
    const lower_key = key.toLowerCase();
    for (const pattern of PROHIBITED_ATTRIBUTE_PATTERNS) {
      if (lower_key === pattern || lower_key.includes(pattern)) {
        throw new SubjectRegistryError(
          SubjectRegistryErrorCode.INVALID_ATTRIBUTES,
          `Prohibited attribute key detected: "${key}". Credential and sensitive data must not be stored in subject attributes.`
        );
      }
    }

    // Check for valid primitive types only
    const value_type = typeof value;
    if (value_type !== 'string' && value_type !== 'number' && value_type !== 'boolean') {
      throw new SubjectRegistryError(
        SubjectRegistryErrorCode.INVALID_ATTRIBUTES,
        `Attribute "${key}" has invalid type "${value_type}". Only string, number, and boolean are permitted.`
      );
    }

    // Reject null explicitly (typeof null === 'object', but check anyway)
    if (value === null || value === undefined) {
      throw new SubjectRegistryError(
        SubjectRegistryErrorCode.INVALID_ATTRIBUTES,
        `Attribute "${key}" must not be null or undefined.`
      );
    }
  }
}

/**
 * Ensure subject is not in a terminal state (INV-SR-009, INV-SR-010)
 * 
 * Terminal State Guard — highest priority in guard evaluation order.
 * Rejects all mutations on ARCHIVED or DELETED subjects.
 * 
 * @param subject - Subject record to check
 * @throws SubjectRegistryError if subject is in terminal state
 */
export function ensureSubjectNotInTerminalState(subject: SubjectRecord): void {
  if (isTerminalState(subject.status)) {
    throw new SubjectRegistryError(
      SubjectRegistryErrorCode.TERMINAL_STATE_MUTATION,
      `Cannot mutate subject in terminal state "${subject.status}". Terminal states are permanent and irreversible.`,
      subject.subject_id
    );
  }
}

/**
 * Generate a unique subject ID (UUID v4)
 * 
 * CON-SR-006: Subject IDs must not contain PII or sensitive data.
 * UUIDs are random and contain no semantic information.
 * 
 * @returns UUID v4 string
 */
export function generateSubjectId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new subject record
 * 
 * Enforces:
 * - INV-SR-002: Unique subject_id via UUID generation
 * - INV-SR-003: Non-null subject_type
 * - INV-SR-006: Version starts at 1
 * - INV-SR-007: created_at = updated_at = now()
 * - Initial status is ACTIVE (per state machine design)
 * 
 * @param subject_type - Type of subject
 * @param attributes - Optional structural identity attributes
 * @returns New subject record with version 1 and ACTIVE status
 */
export function createSubjectRecord(
  subject_type: SubjectType,
  attributes: SubjectAttributes = {}
): SubjectRecord {
  validateSubjectType(subject_type);
  validateSubjectAttributes(attributes);

  const now = new Date();

  return {
    subject_id: generateSubjectId(),
    subject_type,
    status: SubjectStatus.ACTIVE,
    attributes: { ...attributes }, // Defensive copy
    created_at: now,
    updated_at: now,
    version: 1,
  };
}
