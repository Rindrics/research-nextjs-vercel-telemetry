"use server";
import { metrics, DiagConsoleLogger, diag, DiagLogLevel } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { metricExporter } from "../instrumentation.node";
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

// Enable debug logging for OpenTelemetry
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const meter = metrics.getMeter("server action");
const counter = meter.createCounter("function_call", {
  description: "number of function calls",
});

// Initialize LoggerProvider
const loggerProvider = new LoggerProvider();

// Create and configure OTLP exporter for logs
const otlpLogExporter = new OTLPLogExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
  headers: {}, // Add any necessary headers
});

// Configure BatchLogRecordProcessor with more frequent exports
const batchProcessor = new BatchLogRecordProcessor(otlpLogExporter, {
  scheduledDelayMillis: 1000, // Export every 1 second
  exportTimeoutMillis: 30000, // 30 seconds timeout
});

// Add log processor
loggerProvider.addLogRecordProcessor(batchProcessor);

// Set the global logger provider
logs.setGlobalLoggerProvider(loggerProvider);

// Get a logger instance
const logger = logs.getLogger('server-action-logger');

// Helper function to log to both console and OpenTelemetry
function log(severity: SeverityNumber, message: string, attributes?: Record<string, any>) {
  // Log to console
  const consoleMethod = severity <= SeverityNumber.INFO ? console.log : console.error;
  consoleMethod(message, attributes);

  // Log to OpenTelemetry
  logger.emit({ severityNumber: severity, body: message, attributes });
}

export async function async_counter() {
  log(SeverityNumber.INFO, 'async_counter() start ---------------------------------');
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  counter.add(1, { function: "async_counter", environment: process.env.VERCEL_ENV || "development" });
  const end = Date.now();
  log(SeverityNumber.INFO, `-----------------------------async_counter() duration: ${end - start}ms`);
  return;
}

export async function force_flush_counter() {
  log(SeverityNumber.INFO, 'force_flush_counter() start =================================');
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  counter.add(1, { function: "force_flush_counter", environment: process.env.VERCEL_ENV || "development" });
  try {
    await metricExporter.forceFlush();
    await batchProcessor.forceFlush();
    log(SeverityNumber.INFO, 'Metrics and logs flushed successfully');
  } catch (error) {
    log(SeverityNumber.ERROR, 'Error flushing metrics or logs:', { 
      error: error instanceof Error ? error.message : String(error)
    });
  }
  const end = Date.now();
  log(SeverityNumber.INFO, `=============================force_flush_counter() duration: ${end - start}ms`);
  return;
}

// Make sure to call this when your application shuts down
export async function shutdownTelemetry() {
  try {
    await batchProcessor.shutdown();
    await loggerProvider.shutdown();
    console.log("Telemetry shut down successfully");
  } catch (error) {
    console.error("Error shutting down telemetry:", error);
  }
}

// Periodic flush (every 10 seconds)
setInterval(() => {
  batchProcessor.forceFlush()
    .then(() => console.log("Periodic flush completed"))
    .catch(error => console.error("Error during periodic flush:", error));
}, 10000);
