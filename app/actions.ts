'use server'

import { metrics } from "@opentelemetry/api";
import { metricExporter } from "../instrumentation.node";

const meter = metrics.getMeter("server action");
const counter= meter.createCounter("function_call", {
description: "number of function calls",
});

export async function async_counter() {
  console.log('async_counter() start ---------------------------------');

  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  counter.add(1, { function: "async_counter", environment: process.env.VERCEL_ENV || "development" });

  const end = Date.now();
  console.log(`-----------------------------async_counter() duration: ${end - start}ms`);

  return;
}

export async function force_flush_counter() {
  console.log('force_flush_counter() start =================================');

  const start = Date.now();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  counter.add(1, { function: "force_flush_counter", environment: process.env.VERCEL_ENV || "development" });

  try {
    await metricExporter.forceFlush();
    console.log('Metrics flushed successfully');
  } catch (error) {
    console.error('Error flushing metrics:', error);
  }

  const end = Date.now();
  console.log(`=============================force_flush_counter() duration: ${end - start}ms`);

  return;
}
