/**
 * Subject Registry Organelle - Event Interface
 * 
 * Event emission contract for subject lifecycle events.
 * 
 * Constitutional Reference:
 * - SUBJECT_REGISTRY_ORGANELLE_DESIGN.md Section 7 (Event Emission Structure)
 */

import { SubjectType, SubjectStatus, SubjectAttributes } from './types';

/**
 * Base Event Structure
 */
export interface BaseEvent {
  /** Unique identifier for the event */
  event_id: string;

  /** Type of event */
  event_type: string;

  /** Subject ID associated with the event */
  subject_id: string;

  /** When the event occurred (UTC) */
  timestamp: Date;
}

/**
 * Subject Created Event
 * 
 * Emitted when a new subject is registered.
 */
export interface SubjectCreatedEvent extends BaseEvent {
  event_type: 'SubjectCreated';
  payload: {
    subject_id: string;
    subject_type: SubjectType;
    status: SubjectStatus;
    attributes: SubjectAttributes;
    created_at: Date;
  };
}

/**
 * Subject Status Changed Event
 * 
 * Emitted when a subject's status changes.
 */
export interface SubjectStatusChangedEvent extends BaseEvent {
  event_type: 'SubjectStatusChanged';
  payload: {
    subject_id: string;
    old_status: SubjectStatus;
    new_status: SubjectStatus;
    reason?: string;
    changed_at: Date;
  };
}

/**
 * Subject Attributes Updated Event
 * 
 * Emitted when a subject's attributes are updated.
 */
export interface SubjectAttributesUpdatedEvent extends BaseEvent {
  event_type: 'SubjectAttributesUpdated';
  payload: {
    subject_id: string;
    updated_attributes: SubjectAttributes;
    updated_at: Date;
  };
}

/**
 * Subject Archived Event
 * 
 * Emitted when a subject is archived.
 */
export interface SubjectArchivedEvent extends BaseEvent {
  event_type: 'SubjectArchived';
  payload: {
    subject_id: string;
    archived_at: Date;
  };
}

/**
 * Subject Deleted Event
 * 
 * Emitted when a subject is deleted.
 */
export interface SubjectDeletedEvent extends BaseEvent {
  event_type: 'SubjectDeleted';
  payload: {
    subject_id: string;
    deleted_at: Date;
  };
}

/**
 * Union type of all subject events
 */
export type SubjectEvent =
  | SubjectCreatedEvent
  | SubjectStatusChangedEvent
  | SubjectAttributesUpdatedEvent
  | SubjectArchivedEvent
  | SubjectDeletedEvent;

/**
 * Event Emitter Interface
 * 
 * Defines the contract for emitting subject lifecycle events.
 * 
 * Delivery Guarantees:
 * - At-least-once delivery: Events may be delivered more than once
 * - Ordering: Events for the same subject_id are delivered in order
 * - Durability: Events are durably stored before acknowledgment
 */
export interface ISubjectEventEmitter {
  /**
   * Emit a subject event
   * 
   * @param event - Event to emit
   */
  emit(event: SubjectEvent): Promise<void>;
}
