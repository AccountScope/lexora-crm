import { randomUUID } from "crypto";
import { AuditActor, AuditEvent, AuditEventType } from "./types";

type AuditSink = (event: AuditEvent) => Promise<void> | void;

interface LogParams {
  type: AuditEventType;
  success: boolean;
  actor?: AuditActor;
  context?: AuditEvent["context"];
  details?: AuditEvent["details"];
}

class AuditLogger {
  private sinks: AuditSink[] = [];

  constructor() {
    this.use(consoleSink);
  }

  use(sink: AuditSink) {
    this.sinks.push(sink);
  }

  async log(params: LogParams) {
    const event: AuditEvent = {
      id: randomUUID(),
      type: params.type,
      success: params.success,
      actor: params.actor,
      context: params.context,
      details: params.details,
      timestamp: new Date().toISOString(),
    };

    await Promise.all(this.sinks.map((sink) => sink(event)));
    return event;
  }
}

const consoleSink: AuditSink = (event) => {
  const payload = {
    ...event,
    context: event.context ?? {},
    details: event.details ?? {},
  };

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.log("[audit]", JSON.stringify(payload));
  }
};

export const auditLogger = new AuditLogger();

export const logAuthEvent = (params: LogParams) => auditLogger.log(params);
