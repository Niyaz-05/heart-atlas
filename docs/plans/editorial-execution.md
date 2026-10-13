# Editorial execution ledger

Source: [authorized plan](2026-10-13-editorial-interactive-pilot.md), baseline `3d4ce3c1b9f71d407949a8aca011a9c0c5acd109`.

## Binding amendments
- HA-10/11 deferred: no studio, GitHub App, hosting, accounts or deployment changes.
- HA-05 local preview + short-lived CI artifact only; physician online access blocked.
- No physician author/reviewer available. HA-09 medical approval and reader acceptance blocked. Never invent identities or approvals. Existing pilot bodies and canonical routes remain published and unreviewed. New medical revisions are not part of this technical delivery.
- No analytics. Contact via GitHub Issues only. Review due dates explicitly selected per review.
- Parent owns independent review, merge, protections and issue closure. Existing unrelated PRs untouched.
- Public Git is not private draft storage. No patient data.

## Delivery sequence and acceptance ledger
| Scope | Technical work / evidence target | Status |
| --- | --- | --- |
| HA-01 | lockfile baseline, computed inventory, pilot semantic snapshots | Implemented: PR #331; baseline and computed inventory recorded |
| HA-02 | explicit metadata, central visibility, fallback, withdrawal, full artifact leak tests | Implemented; automated contracts and browser evidence recorded |
| HA-03 | typed registry/sidecars, stable citations, diagram adapter | Implemented; automated contracts and browser evidence recorded |
| HA-04 | AST literal allowlist before MDX compilation, negative fixtures | Implemented; automated contracts and browser evidence recorded |
| HA-05 | marked SHA preview, noindex, no SW, CI artifact | Implemented: PR #336; online physician acceptance blocked |
| HA-06 | deterministic dependency fingerprints, independent reviewer validation, review gate | Implemented: PR #336/#337; human and protection acceptance parent-owned |
| HA-07 | isolated guided diagram, keyboard/noJS/motion/print | Implemented; automated contracts and browser evidence recorded |
| HA-08 | isolated semantic fictional report explorer | Implemented; automated contracts and browser evidence recorded |
| HA-09 | author/reviewer templates; retain originals | Technical docs implemented: PR #337; medical content/human pilot blocked |
| HA-10/11 | studio | Deferred by authorization |
| HA-12 | doctors contact, print, maintenance docs | Safe technical portion implemented: PR #337; verified pilot promotion blocked |

## Evidence and toolchain
Raw real execution logs: `/home/hermes2/projects/heart-atlas-evidence/` (outside Git).
Isolated tools: `/home/hermes2/tools/heart-atlas-toolchain/node_modules/.bin`; Node 24.21.0, pnpm 10.34.6. Prepend this directory to PATH; no global installs.
ECC planner/architect/TDD/security templates read. Actual root package scripts determine gates. Tests precede production changes with RED/GREEN checkpoint commits. No merge without parent review of final SHA.
