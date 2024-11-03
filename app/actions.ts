"use server";

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from "ai/rsc";
import { schema } from "./schema";
import { metrics } from "@opentelemetry/api";
import { withTelemetry, openAIMetrics } from "./telemetryHelper"

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
        if (result.usage?.totalTokens) {
          openAIMetrics.updateTokens(result.usage.totalTokens);
        }
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
