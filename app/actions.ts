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
