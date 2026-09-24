# Admin request origins

Admin mutations use relative `/api/admin/...` URLs and validate the browser's
`Origin` before authentication and data changes. `CONTROL_URL` is the canonical
admin origin. `CONTROL_ALLOWED_ORIGINS` optionally contains comma-separated,
exact additional admin origins verified against this Vercel project's aliases.
Configure this independently for each deployment environment. Do not add
wildcards, public-site origins, or unrelated Preview deployments.

On Vercel, the exact deployment's platform-provided `VERCEL_URL` is also trusted
to permit verification of a staged release. Request `Host` and forwarded headers
never extend the allowlist. Missing, opaque, malformed and untrusted origins fail
with `INVALID_ORIGIN`. Local development defaults to `http://localhost:3001` only
outside Vercel; set `CONTROL_URL` when using a different local origin.

The September 2026 draft-saving failure occurred on the verified Production
alias `https://tiladys-control-tiladys.vercel.app`. Its relative PATCH request
correctly went to that same origin, but the previous validator accepted only
`https://tiladys-control.vercel.app`. Production's additional-origin setting now
contains the exact team alias. This setting requires a new deployment to take
effect; changing it does not update an already-built deployment.

Release verification must include an authenticated draft save and reload through
each supported admin alias, plus a rejected authenticated request with an
untrusted Origin. Check that failed saves retain edits and that each issuance
requirement focuses its field. Final issuance tests belong only in an isolated
database with synthetic records. Never issue an existing customer's invoice as
a deployment test. Schema checks remain read-only and run before builds.
