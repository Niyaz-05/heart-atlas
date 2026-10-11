import { NodeIO, type Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { ID_PATTERN, type Structure } from './structures.ts';

export async function readModel(bytes: Uint8Array): Promise<Document> {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  return io.readBinary(bytes);
}

/** Checks that a model has exactly one node per structure, with geometry only on mesh structures. */
export function checkStructureNodes(doc: Document, structures: readonly Structure[]): string[] {
  const errors: string[] = [];
  const nodes = doc.getRoot().listNodes();
  const counts = new Map<string, number>();
  for (const node of nodes) {
    const name = node.getName();
    counts.set(name, (counts.get(name) ?? 0) + 1);
    // three.js GLTFLoader rewrites names outside this pattern and suffixes duplicates.
    if (!ID_PATTERN.test(name)) errors.push(`node "${name}" does not match ${ID_PATTERN}`);
  }
  for (const [name, count] of counts)
    if (count > 1) errors.push(`node "${name}" appears ${count} times`);
  for (const s of structures) {
    const node = nodes.find((n) => n.getName() === s.id);
    if (!node) {
      errors.push(`missing node for ${s.id}`);
      continue;
    }
    const mesh = node.getMesh();
    if (s.kind === 'mesh') {
      const triangles =
        mesh?.listPrimitives().reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0) ?? 0;
      if (triangles === 0) errors.push(`${s.id} has no triangles`);
    } else if (mesh) {
      errors.push(`zone ${s.id} must not have geometry`);
    }
  }
  const known = new Set(structures.map((s) => s.id));
  for (const name of counts.keys())
    if (!known.has(name)) errors.push(`node "${name}" is not in structures.yaml`);
  return errors;
}
