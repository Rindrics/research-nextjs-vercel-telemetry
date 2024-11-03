"use server";

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from "ai/rsc";
import { schema } from "./schema";
import { metrics } from "@opentelemetry/api";
import { withTelemetry } from "./telemetryHelper"

async function generateImpl(input: string) {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream, object } = await streamObject({
      model: openai('gpt-4o-mini'),
      system: 'You generate an an answer to a question in 3000 words.',
      schema,
      prompt: input,
      onFinish: (result) => {
        console.log("onFinish---");
        console.log(result);
        const meter = metrics.getMeter("OpenAI");
        const tokenGauge = meter.createObservableGauge("token_consumed", {
          description: "Number of OpenAI API tokens consumed by each request",
          unit: "tokens",
        });
        let currentTokens = 0;
        tokenGauge.addCallback(observableResult => {
          observableResult.observe(currentTokens, {
            environment: process.env.VERCEL_ENV ?? 'development'
          });
        });
        currentTokens = result.usage.totalTokens;
      }
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    const result = await object;

    stream.done();
  })()
  return { object: stream.value };
};

export const generate = withTelemetry("generate", generateImpl);
