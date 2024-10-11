import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";

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

export const metricExporter = new OTLPMetricExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  headers: headers,
});
