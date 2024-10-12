import { registerOTel } from "@vercel/otel";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

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

const metricExporter = new OTLPMetricExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  headers: headers,
});

export const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10000,
});

registerOTel({
  serviceName: "research-nextjs-vercel-telemetry",
  metricReader: metricReader,
});
console.log("-- OTEL registered --");
