import { test as base, expect } from '@playwright/test'
const { readPolicy, assertHealthy } = require('./run-monitor.cjs')
const { installBrowserGuards } = require('./browser-policy.cjs')
export const test = base.extend({
  context: async ({ context }, use) => {
    const policy = readPolicy()
    await installBrowserGuards(context, { policy })
    await use(context)
    assertHealthy(policy)
  },
})
// Fences every scenario against a violation raised in another process.
test.beforeEach(() => assertHealthy(readPolicy()))
export { expect }
