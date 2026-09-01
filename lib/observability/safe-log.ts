import "server-only";

import { randomUUID } from "node:crypto";

type SafeEvent = {
  operation: string;
  status: "started" | "succeeded" | "failed";
  requestId?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  errorCode?: string;
};

export function createOperationId() {
  return randomUUID();
}

export function safeOperationalLog(event: SafeEvent) {
  const record = {
    event: "cantu_operation",
    operation: event.operation,
    status: event.status,
    ...(event.requestId ? { requestId: event.requestId } : {}),
    ...(event.provider ? { provider: event.provider } : {}),
    ...(event.model ? { model: event.model } : {}),
    ...(Number.isFinite(event.latencyMs) ? { latencyMs: event.latencyMs } : {}),
    ...(event.errorCode ? { errorCode: event.errorCode } : {}),
  };
  if (event.status === "failed") console.error(JSON.stringify(record));
  else if (process.env.NODE_ENV !== "test") console.info(JSON.stringify(record));
}
