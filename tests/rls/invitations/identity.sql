-- PREPARED ONLY. Run solely after Stage 3C.2 approval and independent runtime identity review.
-- The marker/name/loopback checks are accident guards, NOT proof of isolation.
\set ON_ERROR_STOP on
\if :{?expected_run_id}
\else
  \echo 'BLOCKED: expected_run_id required'
  \quit 3
\endif
select current_database()='aibeat_c01_isolation'
  and inet_server_addr() in ('127.0.0.1'::inet,'::1'::inet)
  and (select count(*)=1 from c01_test_control.identity where run_id=:'expected_run_id'::uuid
    and purpose='C01_DISPOSABLE_INVITATION_ONLY') as identity_ok \gset
\if :identity_ok
\else
  \echo 'BLOCKED: disposable database identity mismatch'
  \quit 3
\endif
