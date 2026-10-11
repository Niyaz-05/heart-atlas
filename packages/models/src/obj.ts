/** Triangle mesh read from a Wavefront OBJ file: only `v` and `f` records are used. */
export interface ObjMesh {
  positions: Float32Array<ArrayBuffer>;
  indices: Uint32Array<ArrayBuffer>;
}

/** Parses vertices and faces; polygons are fan-triangulated, texture and normal refs are ignored. */
export function parseObj(text: string): ObjMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.split(/\s+/);
      positions.push(Number(x), Number(y), Number(z));
    } else if (line.startsWith('f ')) {
      const count = positions.length / 3;
      const refs = line
        .split(/\s+/)
        .slice(1)
        .map((token) => {
          const index = Number.parseInt(token.split('/')[0] ?? '', 10);
          // OBJ indices are 1-based; negative ones count back from the last vertex.
          return index < 0 ? count + index : index - 1;
        });
      if (refs.some((i) => !Number.isInteger(i) || i < 0 || i >= count)) {
        throw new Error(`Bad face record: ${line}`);
      }
      for (let i = 1; i + 1 < refs.length; i++) {
        indices.push(refs[0] as number, refs[i] as number, refs[i + 1] as number);
      }
    }
  }
  if (positions.some((n) => !Number.isFinite(n))) throw new Error('Non-numeric vertex in OBJ');
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

/** Concatenates meshes into one, offsetting indices. */
export function mergeMeshes(meshes: readonly ObjMesh[]): ObjMesh {
  const vertexCount = meshes.reduce((n, m) => n + m.positions.length, 0);
  const indexCount = meshes.reduce((n, m) => n + m.indices.length, 0);
  const positions = new Float32Array(vertexCount);
  const indices = new Uint32Array(indexCount);
  let p = 0;
  let i = 0;
  for (const mesh of meshes) {
    positions.set(mesh.positions, p);
    const offset = p / 3;
    for (const index of mesh.indices) indices[i++] = index + offset;
    p += mesh.positions.length;
  }
  return { positions, indices };
}
