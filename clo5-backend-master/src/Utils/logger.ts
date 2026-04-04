type LogLevel = "info" | "error";

type LogContext = Record<string, unknown>;

function writeLog(level: LogLevel, message: string, context: LogContext = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: "backend",
    message,
    ...context,
  };

  const serializedPayload = JSON.stringify(payload);

  if (level === "error") {
    console.error(serializedPayload);
    return;
  }

  console.info(serializedPayload);
}

export function logInfo(message: string, context?: LogContext) {
  writeLog("info", message, context);
}

export function logError(message: string, context?: LogContext) {
  writeLog("error", message, context);
}
