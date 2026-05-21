/**
 * Rename the built APK to match the desktop naming convention:
 *   OneDocs_2.0.0_android-universal.apk
 *
 * Usage: node scripts/rename-apk.mjs
 */
import { readFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
const version = pkg.version || '0.0.0';

const apkDir = join(root, 'src-tauri', 'gen', 'android', 'app', 'build', 'outputs', 'apk', 'universal', 'release');

// Try both signed and unsigned filenames
const possibleNames = [
  'app-universal-release.apk',
  'app-universal-release-unsigned.apk',
];

let sourceFile = null;
for (const name of possibleNames) {
  const fullPath = join(apkDir, name);
  if (existsSync(fullPath)) {
    sourceFile = fullPath;
    break;
  }
}

if (!sourceFile) {
  console.error('❌ APK not found in', apkDir);
  process.exit(1);
}

const targetName = `OneDocs_${version}_android-universal.apk`;
const targetFile = join(apkDir, targetName);

copyFileSync(sourceFile, targetFile);
console.log(`✅ APK renamed: ${targetName}`);
