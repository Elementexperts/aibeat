import { verifySuppressionSetup } from '../lib/email-suppression-preflight'
verifySuppressionSetup().then(() => {
  console.log('Suppression preflight passed: project pairing and backend RPC verified. No email was sent.')
}).catch(error => {
  console.error(error instanceof Error ? error.message : 'Suppression preflight failed.')
  process.exitCode = 1
})
