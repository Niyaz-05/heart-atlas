# @heart-atlas/models

Builds and checks the 3D heart model. Spec: `docs/plans/2026-10-11-stage-1-heart-model.md`.

- `assets/models/heart/structures.yaml` lists the structures (ids are a public contract) and the BodyParts3D elements each one is built from.
- `assets/models/heart/conduction.yaml` holds the schematic conduction system.
- `pnpm --filter @heart-atlas/models assemble <obj dir>` writes `assets/models/heart/heart.glb`. The obj dir is the unpacked BodyParts3D archive pinned in `assets/models/heart/sources.yaml`; the `models` workflow in GitHub Actions does the download and opens a branch with the result.
- `pnpm test` checks `assets/models/LICENSES.yaml` and that the model has a node for every structure.

The code is MIT; the model and the YAML data under `assets/` are CC BY-SA 4.0.
