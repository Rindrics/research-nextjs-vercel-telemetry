import { registerOTel } from "@vercel/otel";
import { metricReader } from "./instrumentation.node";

export function register() {
  registerOTel({
    serviceName: "research-nextjs-vercel-telemetry",
    metricReader: metricReader,
  });
  console.log("-- OTEL registered --");
}
