import { SubjectRegistryConfig, SubjectRegistryState, SubjectRegistryCommand, SubjectRegistryResult, SubjectData, AuditEntry, OperationMetrics } from "./types";

export class SubjectRegistryEntity {
  private readonly id: string;
  private readonly config: SubjectRegistryConfig;
  private state: SubjectRegistryState;
  private readonly subjects: Map<string, SubjectData>;
  private readonly createdAt: number;
  private updatedAt: number;
  private operationCount: number;
  private successCount: number;
  private errorCount: number;
  private totalDuration: number;
  private readonly auditLog: AuditEntry[];

  constructor(config: SubjectRegistryConfig) {
    this.id = config.id;
    this.config = Object.freeze({ ...config });
    this.state = SubjectRegistryState.IDLE;
    this.subjects = new Map();
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.operationCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalDuration = 0;
    this.auditLog = [];
  }

  getId(): string { return this.id; }
  getState(): SubjectRegistryState { return this.state; }
  getSubjectCount(): number { return this.subjects.size; }

  setState(newState: SubjectRegistryState): void {
    const oldState = this.state;
    this.validateTransition(oldState, newState);
    this.state = newState;
    this.updatedAt = Date.now();
    this.auditLog.push({ id: `audit-${this.auditLog.length + 1}`, timestamp: Date.now(), action: "STATE_TRANSITION", actor: this.id, before: oldState, after: newState, correlationId: `transition-${Date.now()}` });
  }

  private validateTransition(from: SubjectRegistryState, to: SubjectRegistryState): void {
    const valid: Record<string, string[]> = {
      [SubjectRegistryState.IDLE]: [SubjectRegistryState.PROCESSING, SubjectRegistryState.TERMINATED],
      [SubjectRegistryState.PROCESSING]: [SubjectRegistryState.COMPLETED, SubjectRegistryState.ERROR],
      [SubjectRegistryState.COMPLETED]: [SubjectRegistryState.IDLE],
      [SubjectRegistryState.ERROR]: [SubjectRegistryState.IDLE],
      [SubjectRegistryState.TERMINATED]: [],
    };
    if (!(valid[from] || []).includes(to)) throw new Error(`Invalid transition: ${from} -> ${to}`);
  }

  execute(command: SubjectRegistryCommand): SubjectRegistryResult {
    if (this.state !== SubjectRegistryState.IDLE) throw new Error(`Cannot execute in state: ${this.state}`);
    const startTime = Date.now();
    this.setState(SubjectRegistryState.PROCESSING);
    this.operationCount++;
    try {
      const result = this.processCommand(command);
      this.setState(SubjectRegistryState.COMPLETED);
      this.successCount++;
      const duration = Date.now() - startTime;
      this.totalDuration += duration;
      this.setState(SubjectRegistryState.IDLE);
      return { success: true, data: result, duration, correlationId: command.correlationId };
    } catch (error) {
      this.setState(SubjectRegistryState.ERROR);
      this.errorCount++;
      const duration = Date.now() - startTime;
      this.totalDuration += duration;
      this.setState(SubjectRegistryState.IDLE);
      return { success: false, error: { code: "EXECUTION_FAILED", message: error instanceof Error ? error.message : String(error) }, duration, correlationId: command.correlationId };
    }
  }

  private processCommand(command: SubjectRegistryCommand): Record<string, unknown> {
    switch (command.type) {
      case "REGISTER": {
        const subjectId = command.payload["subjectId"] as string || `subj-${Date.now()}`;
        if (this.subjects.has(subjectId)) throw new Error(`Subject already exists: ${subjectId}`);
        const subject: SubjectData = { subjectId, type: (command.payload["type"] as string) || "default", name: (command.payload["name"] as string) || subjectId, attributes: (command.payload["attributes"] as Record<string, unknown>) || {}, status: "active", createdAt: Date.now(), updatedAt: Date.now() };
        this.subjects.set(subjectId, subject);
        return { registered: true, subjectId, subject };
      }
      case "LOOKUP": {
        const id = command.payload["subjectId"] as string;
        const subject = this.subjects.get(id);
        if (!subject) throw new Error(`Subject not found: ${id}`);
        return { found: true, subject };
      }
      case "UPDATE": {
        const id = command.payload["subjectId"] as string;
        const existing = this.subjects.get(id);
        if (!existing) throw new Error(`Subject not found: ${id}`);
        const updated = { ...existing, ...command.payload["updates"] as Record<string, unknown>, updatedAt: Date.now() };
        this.subjects.set(id, updated as SubjectData);
        return { updated: true, subject: updated };
      }
      case "ARCHIVE": {
        const id = command.payload["subjectId"] as string;
        const existing = this.subjects.get(id);
        if (!existing) throw new Error(`Subject not found: ${id}`);
        const archived = { ...existing, status: "archived" as const, updatedAt: Date.now() };
        this.subjects.set(id, archived);
        return { archived: true, subjectId: id };
      }
      default: throw new Error(`Unknown command: ${command.type}`);
    }
  }

  getMetrics(): OperationMetrics {
    return { totalOperations: this.operationCount, successCount: this.successCount, errorCount: this.errorCount, averageDuration: this.operationCount > 0 ? this.totalDuration / this.operationCount : 0, lastOperationAt: this.updatedAt };
  }

  getAuditLog(): ReadonlyArray<AuditEntry> { return [...this.auditLog]; }

  toSnapshot(): Record<string, unknown> {
    return { id: this.id, state: this.state, config: this.config, subjectCount: this.subjects.size, operationCount: this.operationCount, successCount: this.successCount, errorCount: this.errorCount, createdAt: this.createdAt, updatedAt: this.updatedAt, auditLogSize: this.auditLog.length };
  }
}
