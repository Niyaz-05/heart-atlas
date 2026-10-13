# Medical review and local preview

## Human blockers
No physician author or independent reviewer is currently available. No article is medically verified by this delivery. HA-09 medical content, reader sessions and human acceptance remain blocked. Studio (HA-10/11) is explicitly deferred. A single GitHub administrator is not a second human reviewer; parent/maintainer owns protection policy and approval enforcement.

## Preview a fixed version

Use Node >=24 and pnpm 10.34.6, then:

```sh
pnpm install --frozen-lockfile
HA_CONTENT_MODE=preview pnpm build
pnpm preview -- --host 127.0.0.1
node scripts/build-content-fingerprints.mjs ru/anatomy/heart-valves
```

The preview uses the real article layout and all components, carries the full Git commit's short SHA and noindex, and has no manifest or service worker. Ordinary builds never use query parameters to select draft mode. Use a separate local origin/port from production. Noindex is not access control. Public branches, artifacts and issues must never contain confidential drafts or patient data.

The read-only PR workflow produces a downloadable artifact retained for three days, not a hosted link. After downloading, serve its contents under `/heart-atlas/` (the configured BASE_PATH). A maintainer can share a local screen session; an online physician link remains an explicit external blocker. Closed PR artifacts expire by retention; there is no public deployment to remove. Do not execute untrusted PRs with editor/production secrets or `pull_request_target`.

## Review checklist

Record article ID and language, full commit SHA and package digest. Read patient and student levels, every diagram state and step, source claim mapping, every quiz option/answer, all report terms, static/no-JS fallback, mobile/keyboard/reduced-motion and print. A Russian review never approves English. The confirmation must identify the digest, scope and explicit next-review date. Source availability checks are not clinical verification.

Reviewer registry entries require real identity/credential verification and consent; keep private evidence outside Git. No self-review. A maintainer records the physician's real confirmation at an auditable repository issue/PR comment and references it, with the matching digest, in `editorial/reviews/<locale>--<type>--<slug>.json`. Fields are `articleId`, `locale`, `reviewerId`, `digest`, `reviewedAt`, `nextReview`, `scope` (text/sources/quiz/interactive/fallback), full `commit`, and `confirmation: {by, digest, url}`. These are attestations, not cryptographic proof of a person: protected PR review and checking the actual confirmation remain mandatory. Never manufacture evidence to make the gate pass.

The fingerprint automatically includes article text/medical metadata, quiz, sidecar, dependency paths, all shared component/lib/locale/physiology/viewer/model resources, and the fingerprint policy itself. This intentionally over-invalidates; unrelated README and the review record do not alter the digest. Adding/removing dependencies changes it. Renderer/code changes need independent technical review as well.

## Publishing, expiry and emergency withdrawal

New articles default draft. Only explicit published entries enter public article/list/embed/search/track output. Existing legacy IDs may remain unreviewed; do not enlarge the legacy allowlist to bypass review. A changed verified article remains in its PR until reviewed; the previous production version stays live. A stale record blocks publishing that revision. The live status must not be inferred from legacy frontmatter `review`.

For an urgent unsafe article: set `publication: withdrawn` with a reason and maintainer review. The route becomes an unindexed tombstone without the medical text; remove/update affected track steps. Update/release the service worker. Devices that never reconnect and independently saved copies cannot be remotely erased. Never promise revocation of those copies. No emergency should retain an inappropriate verified badge.

## Maintenance

Run `node scripts/check-medical-review.mjs` and the existing Links workflow regularly. Review each next-review date; a single universal interval is not a medical standard. Keep one consolidated editorial maintenance issue rather than one per article; existing external link checking remains the source of link availability findings. No analytics or patient telemetry are added. Pilot track/home promotion and selected medical questions-to-ask require real clinical/reader acceptance and are deliberately not shipped here.
