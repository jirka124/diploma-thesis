import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = path.join(root, 'src/assets/generated');
const manifest = JSON.parse(await readFile(path.join(root, 'tools/assets/manifest.json'), 'utf8'));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const seen = new Set();
for (const asset of manifest) {
  const source = await readFile(path.resolve(root, asset.source));
  const sourceSha256 = hash(source);
  for (const output of asset.outputs) {
    const target = path.resolve(outputRoot, output.path);
    if (!target.startsWith(outputRoot + path.sep) || !target.endsWith('.webp') || seen.has(target)) throw new Error(`Invalid output: ${output.path}`);
    seen.add(target);
    const metadata = { schemaVersion: 1, source: asset.source, sourceSha256, output, generator: { version: 1, sharp: sharp.versions } };
    const fingerprint = hash(JSON.stringify(metadata));
    const fingerprintPath = `${target}.fingerprint`;
    try {
      const previous = JSON.parse(await readFile(fingerprintPath, 'utf8'));
      await access(target);
      if (previous.fingerprint === fingerprint) { console.log(`Unchanged: ${output.path}`); continue; }
    } catch { /* Missing or invalid cache is regenerated. */ }
    await mkdir(path.dirname(target), { recursive: true });
    let image = sharp(source);
    if (output.padding) {
      image = image.extend({ top: 0, bottom: 0, left: 0, right: 0, ...output.padding, background: { r: 0, g: 0, b: 0, alpha: 0 } });
      // Sharp applies resize before extend in one pipeline; materialize the padded image first.
      image = sharp(await image.png().toBuffer());
    }
    await image.resize({ width: output.width, withoutEnlargement: true }).webp({ quality: output.quality }).toFile(target);
    await writeFile(fingerprintPath, JSON.stringify({ ...metadata, fingerprint }, null, 2) + '\n');
    console.log(`Generated: ${output.path}`);
  }
}
