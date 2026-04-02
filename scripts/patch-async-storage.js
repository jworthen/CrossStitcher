#!/usr/bin/env node
/**
 * Patches @react-native-async-storage/async-storage/android/build.gradle to remove
 * the `configurations { compileClasspath }` block that pre-declares compileClasspath
 * before AGP applies it.
 *
 * In Gradle 9.x, pre-declaring compileClasspath gives it the wrong role, breaking
 * AGP's artifact transform provider chain and causing:
 *   "Cannot query the value of this provider because it has no value available"
 *   at LocalFileDependencyBackedArtifactSet.visitDependencies
 *
 * AGP creates and owns compileClasspath when com.android.library is applied.
 */

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-async-storage',
  'async-storage',
  'android',
  'build.gradle'
);

if (!fs.existsSync(buildGradlePath)) {
  console.log('[patch-async-storage] build.gradle not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

const problematicBlock = /^configurations\s*\{\s*\r?\n\s*compileClasspath\s*\r?\n\s*\}\s*\r?\n/m;

if (problematicBlock.test(content)) {
  content = content.replace(
    problematicBlock,
    '// configurations { compileClasspath } removed by scripts/patch-async-storage.js\n' +
    '// Pre-declaring compileClasspath before AGP breaks Gradle 9.x artifact transform providers.\n\n'
  );
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('[patch-async-storage] Patched: removed configurations { compileClasspath } block.');
} else {
  console.log('[patch-async-storage] Already patched or block not found, no changes made.');
}
