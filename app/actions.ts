"use server";

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from "ai/rsc";
import { schema } from "./schema";
import { metrics } from "@opentelemetry/api";

export async function generate(input: string) {
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
        const tokenCounter = meter.createCounter("token_consumed", {
          description: "Number of OpenAI API tokens consumed by each request",
        });
        tokenCounter.add(result.usage.totalTokens, {
                environment: process.env.VERCEL_ENV,
        });
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
