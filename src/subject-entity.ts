/**
 * Subject Registry Organelle - Subject Entity
 * 
 * Subject entity model with invariant enforcement.
 * 
 * Constitutional Reference:
 * - SUBJECT_REGISTRY_ORGANELLE.md Section 7 (Invariants)
 * - SUBJECT_REGISTRY_ORGANELLE_DESIGN.md Section 5 (Internal Consistency Rules)
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
 * Prohibited attribute keys (cross-category contamination prevention)
 */
const PROHIBITED_ATTRIBUTE_KEYS = [
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'credential',
  'secret',
  'role',
  'roles',
  'permission',
  'permissions',
  'tenant_id',
  'tenant',
  'workspace_id',
  'manager_id',
  'reports_to',
  'ssn',
  'credit_card',
];

/**
 * Validate subject type
 * 
 * @param subject_type - Subject type to validate
 * @throws SubjectRegistryError if invalid
 */
export function validateSubjectType(subject_type: SubjectType): void {
  const valid_types = Object.values(SubjectType);
  if (!valid_types.includes(subject_type)) {
    throw new SubjectRegistryError(
      SubjectRegistryErrorCode.INVALID_SUBJECT_TYPE,
      `Invalid subject type: ${subject_type}`
    );
  }
}

/**
 * Validate subject status
 * 
 * @param status - Status to validate
 * @throws SubjectRegistryError if invalid
 */
export function validateSubjectStatus(status: SubjectStatus): void {
  const valid_statuses = Object.values(SubjectStatus);
  if (!valid_statuses.includes(status)) {
    throw new SubjectRegistryError(
      SubjectRegistryErrorCode.INVALID_STATUS,
      `Invalid subject status: ${status}`
    );
  }
}

/**
 * Validate subject attributes
 * 
 * Enforces:
 * - No prohibited attribute keys (cross-category contamination)
 * - No nested objects
 * - No arrays
 * - Only primitive types (string, number, boolean)
 * 
 * @param attributes - Attributes to validate
 * @throws SubjectRegistryError if invalid
 */
export function validateSubjectAttributes(attributes: SubjectAttributes): void {
  for (const [key, value] of Object.entries(attributes)) {
    // Check for prohibited keys
    if (PROHIBITED_ATTRIBUTE_KEYS.includes(key.toLowerCase())) {
      throw new SubjectRegistryError(
        SubjectRegistryErrorCode.PROHIBITED_ATTRIBUTE,
        `Prohibited attribute key: ${key}`
      );
    }

    // Check for nested objects or arrays
    if (typeof value === 'object') {
      throw new SubjectRegistryError(
        SubjectRegistryErrorCode.INVALID_ATTRIBUTE_TYPE,
        `Attribute value must be a primitive type (string, number, boolean), got object for key: ${key}`
      );
    }

    // Check for valid primitive types
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new SubjectRegistryError(
        SubjectRegistryErrorCode.INVALID_ATTRIBUTE_TYPE,
        `Attribute value must be a primitive type (string, number, boolean), got ${typeof value} for key: ${key}`
      );
    }
  }
}

/**
 * Check if a subject can be mutated (not in terminal state)
 * 
 * @param subject - Subject record to check
 * @throws SubjectRegistryError if subject is in terminal state
 */
export function ensureSubjectNotInTerminalState(subject: SubjectRecord): void {
  if (isTerminalState(subject.status)) {
    throw new SubjectRegistryError(
      SubjectRegistryErrorCode.TERMINAL_STATE_MUTATION_PROHIBITED,
      `Cannot mutate subject in terminal state: ${subject.status}`
    );
  }
}

/**
 * Generate a unique subject ID (UUID v4)
 * 
 * @returns UUID v4 string
 */
export function generateSubjectId(): string {
  // Simple UUID v4 generation (for production, use a proper UUID library)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new subject record
 * 
 * @param subject_type - Type of subject
 * @param attributes - Optional attributes
 * @returns New subject record
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
    attributes,
    created_at: now,
    updated_at: now,
    version: 1,
  };
}
