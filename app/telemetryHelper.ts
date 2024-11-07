import { diag, DiagConsoleLogger, DiagLogLevel, metrics, trace } from "@opentelemetry/api";
import { logger } from "@/lib/otel";
import { SeverityNumber } from "@opentelemetry/api-logs";


diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
function log(severity: SeverityNumber, message: string, attributes?: Record<string, any>) {
  const consoleMethod = severity <= SeverityNumber.INFO ? console.log : console.error;
  consoleMethod(message, attributes);

  logger.emit({ severityNumber: severity, body: message, attributes });
}

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
          runtime: process.env.NEXT_RUNTIME ?? '',
          environment: process.env.VERCEL_ENV ?? '',
          status: 'success',
        });

        span.setAttribute("duration_ms", duration);
        span.setAttribute("status", "success");

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        const endTime = performance.now();
        const duration = endTime - startTime;

        latencyHistogram.record(duration, {
          runtime: process.env.NEXT_RUNTIME ?? '',
          environment: process.env.VERCEL_ENV ?? '',
          status: 'error',
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

class OpenAIMetrics {
  private meter;
  private tokenGauge;
  private currentTokens = 0;

  constructor() {
    this.meter = metrics.getMeter("OpenAI");
    this.tokenGauge = this.meter.createObservableGauge("token_consumed", {
      description: "Number of OpenAI API tokens consumed by each request",
      unit: "tokens",
    });

    this.tokenGauge.addCallback(observableResult => {
      observableResult.observe(this.currentTokens, {
        runtime: process.env.NEXT_RUNTIME ?? '',
        environment: process.env.VERCEL_ENV ?? '',
      });
    });
    log(SeverityNumber.INFO, `OpenAIMetrics initialized`, {
      runtime: process.env.NEXT_RUNTIME ?? '',
      environment: process.env.VERCEL_ENV ?? '',
    });
  }

  async updateTokens(tokens: number) {
    log(SeverityNumber.INFO, `tokens consumed: ${tokens}`, {
      runtime: process.env.NEXT_RUNTIME ?? '',
      environment: process.env.VERCEL_ENV ?? '',
    });
    try {
      this.currentTokens = tokens;
    } catch (error) {
      console.error('Failed to update token metrics:', error);
      throw error;
    }
  }
}

export const openAIMetrics = new OpenAIMetrics();
