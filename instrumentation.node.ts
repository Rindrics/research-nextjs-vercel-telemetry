import { registerOTel } from "@vercel/otel";
import { metricReader, spanProcessor, debugSpanProcessor, traceExporter, logRecordProcessor } from "@/lib/otel";

registerOTel({
  serviceName: "research-nextjs-vercel-telemetry",
  metricReader: metricReader,
  spanProcessors: [spanProcessor, debugSpanProcessor],
  traceExporter: traceExporter,
  logRecordProcessor: logRecordProcessor,
});

console.log("-- OTEL registered with metrics, traces, and logs --");
