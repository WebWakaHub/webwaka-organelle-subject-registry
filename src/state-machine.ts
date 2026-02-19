/**
 * Subject Registry Organelle - State Machine
 * 
 * Enforces valid state transitions for subject lifecycle status.
 * 
 * Constitutional Reference:
 * - SUBJECT_REGISTRY_ORGANELLE_DESIGN.md Section 3 (State Machine Diagram)
 */

import { SubjectStatus } from './types';

/**
 * Valid State Transitions
 * 
 * Defines the allowed transitions between subject statuses.
 * Terminal states (ARCHIVED, DELETED) have no outgoing transitions.
 */
const VALID_TRANSITIONS: Record<SubjectStatus, SubjectStatus[]> = {
  [SubjectStatus.ACTIVE]: [
    SubjectStatus.SUSPENDED,
    SubjectStatus.ARCHIVED,
    SubjectStatus.DELETED,
  ],
  [SubjectStatus.SUSPENDED]: [
    SubjectStatus.ACTIVE,
    SubjectStatus.ARCHIVED,
    SubjectStatus.DELETED,
  ],
  [SubjectStatus.ARCHIVED]: [], // Terminal state
  [SubjectStatus.DELETED]: [], // Terminal state
};

/**
 * Check if a status transition is valid
 * 
 * @param from_status - Current status
 * @param to_status - Target status
 * @returns true if transition is valid, false otherwise
 */
export function isValidTransition(
  from_status: SubjectStatus,
  to_status: SubjectStatus
): boolean {
  // No-op transition (same status) is allowed but treated as no-op
  if (from_status === to_status) {
    return true;
  }

  const allowed_transitions = VALID_TRANSITIONS[from_status];
  return allowed_transitions.includes(to_status);
}

/**
 * Check if a status is a terminal state
 * 
 * @param status - Status to check
 * @returns true if status is terminal, false otherwise
 */
export function isTerminalState(status: SubjectStatus): boolean {
  return (
    status === SubjectStatus.ARCHIVED ||
    status === SubjectStatus.DELETED
  );
}

/**
 * Get the initial status for a newly registered subject
 * 
 * @returns Initial status (ACTIVE)
 */
export function getInitialStatus(): SubjectStatus {
  return SubjectStatus.ACTIVE;
}
