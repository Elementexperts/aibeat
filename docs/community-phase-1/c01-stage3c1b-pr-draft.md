# Prepared pull request — NOT submitted

Title: Harden Business authorization and accept verified invitations with safe reissue

Base: main (refresh before remote submission)
Head: local codex/c01-business-authorization-hardening commits; a non-deploying remote path is NOT yet verified.

Business mutations now follow database roles and tenant scope, onboarding uses the atomic creator flow, and approval state is reloaded authoritatively. Invitation acceptance uses the confirmed authenticated recipient, immutable receipts and owner-approved roles. Reissuing now revokes each stale-inviter invitation with an attributed audit before reusing a valid invitation or creating a replacement.

Contains separate listing commit d996449 (three reviewed listings and logos), Business/security implementation commit, and test/preparation/documentation commit. Does not merge unrelated automated main updates into the working tree. Review the final diff against freshly fetched main before submission.

Validation: 116 application/listing offline tests, 18 preparation/F1 checks and 33 harness checks PASS; TypeScript and syntax/whitespace checks PASS. Original C01 SHA256 remains 731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C. Corrected invitation SQL SHA256 is EEAB243A588D6DE90FD2E5169EA16B7C07C4022D1C004D75592018215C6AD7BB.

Deployment hold: do not deploy or merge. Invitation migration has NOT been applied or PostgreSQL-validated. Neither historical SQL results nor mocked concurrency certify the corrected migration. Both migration files preserve exact reviewed bytes through targeted Git attributes. Independent runtime, real database tests and fixture/E2E authorizations remain pending.

No production/staging access, migration execution, provisioning, real emails/providers, browser E2E or deployment was performed. Remote submission itself requires a verified non-deploying path because the existing development commit has a Vercel deployment status.
