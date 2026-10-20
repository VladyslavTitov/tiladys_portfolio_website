# Verification — 20 October 2026

## Passed

- Next.js production compilation and static route generation.
- Four Node test cases covering input validation, password verification, cross-origin/oversize rejection, SQLite persistence, parameterized values and moderation visibility.
- HTTP integration against the production server: homepage, booking, admin, privacy, journal, service page, sitemap, robots, photo, icon and 404.
- Canonical markup, demo noindex and robots exclusion.
- Anonymous admin denied; wrong password denied; correct login accepted with HTTP-only cookie.
- Booking saved with a reference and visible in the admin response, including a quoted string and script-like text as inert data.
- Request status updated through the authenticated API.
- Submitted review hidden until publication, then visible through the public API.
- Logout revokes the session; the old cookie is rejected.

## Limits

Browser-based visual/viewport QA, WebGL GPU rendering, screen-reader testing, Lighthouse and real-device performance were not run in this environment. Responsive breakpoints, reduced-motion styles, semantic labels and WebGL fallback are implemented but require browser review. No blanket “zero bugs” claim is made.

Vercel publication was attempted but blocked by a 403 permission error for the TiLADYS team. No live URL is claimed. Local SQLite was tested; the packaged Neon adapter requires a correctly scoped DATABASE_URL and separate cloud verification before publication.

Fictional businesses remain in noindex portfolio mode. Technical SEO does not guarantee a Google ranking. No real appointments, emails, payments or emergency services are dispatched.
