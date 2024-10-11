import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { registerOTel } from "@vercel/otel";
import { metricExporter } from "./instrumentation.node";

export function register() {
  registerOTel({
    serviceName: "research-nextjs-vercel-telemetry",
    attributes: {
      environment: process.env.VERCEL_ENV || "development",
    },
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000,
    }),
  });
  console.log("-- OTEL registered --");
}
