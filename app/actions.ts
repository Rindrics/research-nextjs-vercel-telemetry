"use server";

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from "ai/rsc";
import { schema } from "./schema";
import { metrics } from "@opentelemetry/api";
import { withTelemetry, openAIMetrics } from "./telemetryHelper"
import { Langfuse } from "langfuse";

async function generateImpl(input: string) {
  const lf = new Langfuse();
  const trace = lf.trace({
    id: `${Date.now()}`,
  });
  const stream = createStreamableValue();

  (async () => {
    const model = 'gpt-4o-mini';
    const generation = trace.generation({
      input,
      model,
    });
    const { partialObjectStream, object, usage } = await streamObject({
      model: openai(model),
      system: 'You generate an an answer to a question in 3000 words.',
      schema,
      prompt: input,
      onFinish: async (result) => {
        console.log("onFinish---");
        console.log(result);
        generation.end({
          output: result,
	});
        await lf.shutdownAsync();
      }
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    const result = await object;
    const usageData = await usage;
    openAIMetrics.updateTokens(usageData.totalTokens);

    stream.done();
  })()
  return { object: stream.value };
};

export const generate = withTelemetry("generate", generateImpl);
