import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateBytes } from 'gltf-validator';
import { parseLicenses } from '../src/licenses.ts';
import { checkStructureNodes, readModel } from '../src/model-check.ts';
import { assetsDir } from '../src/paths.ts';
import { parseStructures } from '../src/structures.ts';

const MODEL_FILE = /\.(glb|gltf|obj|fbx|stl|blend)$/i;

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const licenses = parseLicenses(readFileSync(join(assetsDir, 'LICENSES.yaml'), 'utf8'));
const structures = parseStructures(readFileSync(join(assetsDir, 'heart/structures.yaml'), 'utf8'));
const heartPath = join(assetsDir, 'heart/heart.glb');

describe('assets/models/LICENSES.yaml', () => {
  it('follows the license rules', () => {
    expect(licenses.errors).toEqual([]);
  });

  it('has an entry for every model file and a file for every entry', () => {
    const files = listFiles(assetsDir)
      .filter((f) => MODEL_FILE.test(f))
      .map((f) => relative(assetsDir, f).split('\\').join('/'));
    const registered = licenses.entries.map((e) => e.file);
    expect(files.filter((f) => !registered.includes(f))).toEqual([]);
    expect(registered.filter((f) => !existsSync(join(assetsDir, f)))).toEqual([]);
  });
});

describe('heart.glb', () => {
  it('has one node per structure in structures.yaml', async () => {
    const doc = await readModel(readFileSync(heartPath));
    expect(checkStructureNodes(doc, structures)).toEqual([]);
  });

  it('passes glTF-Validator without errors', async () => {
    const report = await validateBytes(new Uint8Array(readFileSync(heartPath)));
    const errors = report.issues.messages.filter((m) => m.severity === 0);
    expect(errors).toEqual([]);
  });
});
