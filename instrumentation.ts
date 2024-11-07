export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    import("./instrumentation.node");
  }
}
