export default async function setup() {
  // --list never calls this. No prior SQL/concurrency approval authorizes browser execution.
  throw new Error('BLOCKED: Stage 3B execution authorization and reviewed fixture manifest required; no application or fixtures started.');
}
