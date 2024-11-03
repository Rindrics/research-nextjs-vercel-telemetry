import { metrics, trace } from "@opentelemetry/api";

export const withTelemetry = (name: string, fn: Function) => {
  return async (...args: any[]) => {
    const tracer = trace.getTracer(name);
    const meter = metrics.getMeter(name);

    const latencyHistogram = meter.createHistogram(`${name}_latency`, {
      description: `Response time for ${name} in milliseconds`,
      unit: "milliseconds",
    });

    const startTime = performance.now();

    return await tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn(...args);

        const endTime = performance.now();
        const duration = endTime - startTime;

        latencyHistogram.record(duration, {
          environment: process.env.VERCEL_ENV ?? 'development',
          status: 'success'
        });

        span.setAttribute("duration_ms", duration);
        span.setAttribute("status", "success");

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        const endTime = performance.now();
        const duration = endTime - startTime;

        latencyHistogram.record(duration, {
          environment: process.env.VERCEL_ENV ?? 'development',
          status: 'error'
        });

        span.setAttribute("status", "error");
        span.recordException(error);

        throw error;
      } finally {
        span.end();
      }
    });
  };
};
