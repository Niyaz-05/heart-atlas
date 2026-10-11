/** Prints "<url> <sha256> <obj_dir>" of the BodyParts3D archive pinned in sources.yaml. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { assetsDir } from './paths.ts';

const { bodyparts3d } = parse(readFileSync(join(assetsDir, 'heart/sources.yaml'), 'utf8')) as {
  bodyparts3d: { url: string; sha256: string; obj_dir: string };
};
console.log(bodyparts3d.url, bodyparts3d.sha256, bodyparts3d.obj_dir);
