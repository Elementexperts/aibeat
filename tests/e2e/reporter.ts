import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
// Intentionally suppress error payloads, action logs and attachments, which may contain secrets.
export default class SanitizedReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) { process.stdout.write(`${test.title}: ${result.status}\n`) }
  onEnd(result: FullResult) { process.stdout.write(`C01 result: ${result.status}; diagnostics suppressed\n`) }
  onError() { process.stderr.write('C01 runner error; credential-bearing diagnostics suppressed\n') }
}
