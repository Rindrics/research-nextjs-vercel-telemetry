"use server";
import { metrics, DiagConsoleLogger, diag, DiagLogLevel } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { metricReader, logger, loggerProvider } from "../instrumentation.node";
import { waitUntil } from '@vercel/functions';

// Enable debug logging for OpenTelemetry
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const meter = metrics.getMeter("server action");
const counter = meter.createCounter("function_call", {
  description: "number of function calls",
});

// Helper function to log to both console and OpenTelemetry
function log(severity: SeverityNumber, message: string, attributes?: Record<string, any>) {
  // Log to console
  const consoleMethod = severity <= SeverityNumber.INFO ? console.log : console.error;
  consoleMethod(message, attributes);

  // Log to OpenTelemetry
  logger.emit({ severityNumber: severity, body: message, attributes });
}

export async function async_counter() {
  log(SeverityNumber.INFO, 'async_counter() start --', {"env": process.env.VERCEL_ENV});
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  counter.add(1, { function: "async_counter", environment: process.env.VERCEL_ENV || "development" });
  const end = Date.now();
  log(SeverityNumber.INFO, `--async_counter() duration: ${end - start}ms`, {"env": process.env.VERCEL_ENV});
  return;
}

export async function force_flush_counter() {
  log(SeverityNumber.INFO, 'force_flush_counter() start ==', {"env": process.env.VERCEL_ENV});
  const start = Date.now();

  counter.add(1, { function: "force_flush_counter", environment: process.env.VERCEL_ENV || "development" });

  const end = Date.now();
  log(SeverityNumber.INFO, `==force_flush_counter() duration: ${end - start}ms`, {"env": process.env.VERCEL_ENV});
  const flushPromise = flushTelemetry();

  waitUntil(flushPromise);

  return;
}

async function flushTelemetry() {
  try {
    log(SeverityNumber.INFO, 'Starting telemetry flush');
    await Promise.all([
      metricReader.forceFlush(),
      loggerProvider.forceFlush(),
    ]);
    await new Promise(resolve => setTimeout(resolve, 15000)); // wait for exporting
    log(SeverityNumber.INFO, 'Logs after me will be visible at next function call because we are outside of Promise');
    log(SeverityNumber.INFO, 'Metrics and logs flushed successfully');
  } catch (error) {
    log(SeverityNumber.ERROR, 'Error flushing metrics or logs:', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
