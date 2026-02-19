/**
 * Subject Registry Organelle - Storage Interface
 * 
 * Abstract storage interface for subject persistence.
 * This interface is technology-agnostic and does not specify a database engine.
 * 
 * Constitutional Reference:
 * - SUBJECT_REGISTRY_ORGANELLE_DESIGN.md Section 9 (Storage Abstraction Interface)
 */

import { SubjectRecord, SubjectStatus } from './types';

/**
 * Storage Operation Result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Storage Interface
 * 
 * Defines the abstract operations required for subject persistence.
 * Implementations must guarantee:
 * - Durability: All writes are durable before acknowledgment
 * - Consistency: Reads are monotonically consistent per client
 * - Isolation: Concurrent updates are serializable (via optimistic concurrency control)
 * - Availability: Storage is highly available (implementation-specific)
 */
export interface ISubjectStorage {
  /**
   * Store a new subject record
   * 
   * @param record - Subject record to store
   * @returns Success indicator and error if subject_id collision occurs
   */
  storeSubject(record: SubjectRecord): Promise<StorageResult<void>>;

  /**
   * Retrieve a subject record by subject_id
   * 
   * @param subject_id - Subject ID to retrieve
   * @returns Subject record if found, undefined if not found
   */
  retrieveSubject(subject_id: string): Promise<StorageResult<SubjectRecord | undefined>>;

  /**
   * Update a subject record with optimistic concurrency control
   * 
   * @param subject_id - Subject ID to update
   * @param expected_version - Expected current version
   * @param updated_record - Updated subject record
   * @returns Success indicator and version_mismatch flag if conflict occurs
   */
  updateSubject(
    subject_id: string,
    expected_version: number,
    updated_record: SubjectRecord
  ): Promise<StorageResult<{ version_mismatch?: boolean }>>;

  /**
   * Query subjects by status
   * 
   * @param status - Status to filter by
   * @returns List of subject_id values matching the status
   */
  querySubjectsByStatus(status: SubjectStatus): Promise<StorageResult<string[]>>;
}
