import { registerOTel } from "@vercel/otel";
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
});

export const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 5000,
});

// Trace Exporter
const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: headers,
});

const spanProcessor = new BatchSpanProcessor(traceExporter);

// For debug purposes, you can also use SimpleSpanProcessor with ConsoleSpanExporter
const debugSpanProcessor = new SimpleSpanProcessor(new ConsoleSpanExporter());

// Log Exporter
const logExporter = new OTLPLogExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
  headers: headers,
});

export const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

// Only add ConsoleLogRecordExporter in development
if (process.env.NODE_ENV !== 'production') {
  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(new ConsoleLogRecordExporter()));
}

const logRecordProcessor = new BatchLogRecordProcessor(logExporter);
loggerProvider.addLogRecordProcessor(logRecordProcessor);

registerOTel({
  serviceName: "research-nextjs-vercel-telemetry",
  metricReader: metricReader,
  spanProcessors: [spanProcessor, debugSpanProcessor],
  traceExporter: traceExporter,
  logRecordProcessor: logRecordProcessor,
});

export const logger = loggerProvider.getLogger("research-nextjs-vercel-telemetry");
console.log("-- OTEL registered with metrics, traces, and logs --");
