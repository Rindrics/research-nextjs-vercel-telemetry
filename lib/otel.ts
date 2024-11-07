import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { LoggerProvider, BatchLogRecordProcessor, ConsoleLogRecordExporter } from '@opentelemetry/sdk-logs';

function parseHeaders(headersString: string | undefined): Record<string, string> {
  if (!headersString) {
    return {};
  }
  const headers: Record<string, string> = {};
  const pairs = headersString.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      headers[key.trim()] = value.trim();
    }
  }
  return headers;
}

const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

// Metric Exporter
const metricExporter = new OTLPMetricExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  headers: headers,
  timeoutMillis: 10000,
});

export const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10000,
  exportTimeoutMillis: 10000,
});

// Trace Exporter
export const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: headers,
  timeoutMillis: 10000,
});

export const spanProcessor = new BatchSpanProcessor(
  traceExporter,
  {
    scheduledDelayMillis: 1000,
    exportTimeoutMillis: 10000,
  }
);

// For debug purposes, you can also use SimpleSpanProcessor with ConsoleSpanExporter
export const debugSpanProcessor = new SimpleSpanProcessor(new ConsoleSpanExporter());

// Log Exporter
const logExporter = new OTLPLogExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
  headers: headers,
  timeoutMillis: 10000,
});

export const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(
  logExporter,
  {
    scheduledDelayMillis: 1000,
    exportTimeoutMillis: 10000,
  }
));

// Only add ConsoleLogRecordExporter in development
if (process.env.NODE_ENV !== 'production') {
  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(new ConsoleLogRecordExporter()));
}

export const logRecordProcessor = new BatchLogRecordProcessor(
  logExporter,
  {
    scheduledDelayMillis: 1000,
    exportTimeoutMillis: 10000,
  }
);
loggerProvider.addLogRecordProcessor(logRecordProcessor);

export const logger = loggerProvider.getLogger("research-nextjs-vercel-telemetry");
