# TiLADYS — five US small-business portfolio concepts

Each subdirectory is a complete, independent Next.js application with its own package.json, lockfile, content, local database, admin setup and README.

| Project | Business | Visual direction |
| --- | --- | --- |
| northline-plumbing | Chicago plumbing | Cobalt, lime and practical service cards |
| torque-motorworks | Austin auto service | Dark editorial, orange and bold type |
| aster-dental | Seattle dental studio | Warm ivory, lilac and soft serif type |
| fieldwork-landscapes | Portland landscaping | Earth tones and an editorial garden layout |
| sunday-home | Denver home cleaning | Peach, sage and playful shapes |

Inside any directory: npm ci → npm run admin:setup → npm run dev. Node 22.13+ required, Node 24 recommended. Each site creates a separate local SQLite database. To run all five, use different ports.

Source is in an isolated portfolio branch. Existing production source is preserved. Do not merge this branch into a live application without reviewing the additions and Vercel build triggers.

Public portfolio request forms use fictional details. No real service is ordered. All sites include a link to tiladys.com for prospects who want a similar website.

Vercel publication remains blocked by the connector’s team permissions. See each project README for the deployment configuration and VERIFICATION.md for completed tests and limitations.
