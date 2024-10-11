'use server'

export async function async_counter() {
  console.log('async_counter() start ---------------------------------');

  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const end = Date.now();
  console.log(`-----------------------------async_counter() duration: ${end - start}ms`);

  return;
}

export async function force_flush_counter() {
  console.log('force_flush_counter() start =================================');

  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const end = Date.now();
  console.log(`=============================force_flush_counter() duration: ${end - start}ms`);

  return;
}
