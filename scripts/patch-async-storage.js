#!/usr/bin/env node
/**
 * Patches @react-native-async-storage/async-storage/android/build.gradle:
 *
 * 1. Removes the `configurations { compileClasspath }` block (async-storage v2.x)
 *    that pre-declares compileClasspath before AGP applies it.
 *    In Gradle 8+, pre-declaring compileClasspath gives it the wrong role, breaking
 *    AGP's artifact transform provider chain and causing:
 *      "Cannot query the value of this provider because it has no value available"
 *
 * 2. Adds the bundled `local_repo` Maven repository to the async-storage module's
 *    own `repositories {}` block so Gradle can resolve:
 *      org.asyncstorage.shared_storage:storage-android:1.0.0
 *    The AAR is shipped inside the npm package at android/local_repo/ and is NOT
 *    published to Maven Central or Google Maven.
 *
 * 3. Fixes the storage-android-1.0.0.module file's broken component redirect.
 *    The .module file contains a "component.url" pointing to
 *    ../../storage/1.0.0/storage-1.0.0.module, which doesn't exist in local_repo.
 *    Gradle always reads the .module file when the POM has the
 *    "published-with-gradle-metadata" marker -- even with metadataSources{mavenPom()}.
 *    Following the missing URL creates an unresolved provider that throws
 *    MissingValueException at task-graph time. Fix: remove the "url" redirect so
 *    Gradle treats storage-android as a self-contained component.
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
let changed = false;

// --- Patch 1: Remove configurations { compileClasspath } block (v2.x artifact) ---
const problematicBlock = /^configurations\s*\{\s*\r?\n\s*compileClasspath\s*\r?\n\s*\}\s*\r?\n/m;

if (problematicBlock.test(content)) {
  content = content.replace(
    problematicBlock,
    '// configurations { compileClasspath } removed by scripts/patch-async-storage.js\n' +
    '// Pre-declaring compileClasspath before AGP breaks Gradle 8+ artifact transform providers.\n\n'
  );
  changed = true;
  console.log('[patch-async-storage] Patched: removed configurations { compileClasspath } block.');
}

// --- Patch 2: Add local_repo to the module-level repositories {} block ---
const LOCAL_REPO_MARKER = 'local_repo added by scripts/patch-async-storage.js';

if (!content.includes(LOCAL_REPO_MARKER)) {
  // Match the module-level repositories block (outside buildscript {})
  // The block looks like:
  //   repositories {
  //       mavenCentral()
  //       google()
  //   }
  const repoBlockPattern = /(^repositories\s*\{[^}]*\})/m;
  // Use File(projectDir, "local_repo").toURI() for cross-platform path safety (avoids
  // Windows backslash issues). Use mavenPom()+artifact() so Gradle reads only the POM
  // and skips the .module file, whose "component" URL points to a missing sibling
  // storage:1.0.0 module -- Gradle following that URL creates an unresolved provider
  // that throws MissingValueException at task-graph time.
  const injection =
    '\n    // ' + LOCAL_REPO_MARKER + '\n' +
    '    // storage-android:1.0.0 is bundled in the npm package, not on Maven Central.\n' +
    '    // mavenPom()+artifact() prevents Gradle following the .module "component" URL\n' +
    '    // to a missing sibling storage:1.0.0 module (MissingValueException fix).\n' +
    '    maven {\n' +
    '        url = new File(projectDir, "local_repo").toURI()\n' +
    '        metadataSources {\n' +
    '            mavenPom()\n' +
    '            artifact()\n' +
    '        }\n' +
    '    }';

  if (repoBlockPattern.test(content)) {
    content = content.replace(repoBlockPattern, (match) => {
      // Insert before the closing brace
      return match.replace(/(\})$/, injection + '\n$1');
    });
    changed = true;
    console.log('[patch-async-storage] Patched: added local_repo to repositories block.');
  } else {
    console.warn('[patch-async-storage] WARNING: Could not find module-level repositories {} block to patch.');
  }
} else {
  console.log('[patch-async-storage] local_repo already present in repositories block, skipping.');
}

if (changed) {
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('[patch-async-storage] Wrote patched build.gradle.');
} else {
  console.log('[patch-async-storage] No changes needed.');
}

// --- Patch 3: Fix storage-android-1.0.0.module broken component redirect ---
const moduleFilePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-async-storage',
  'async-storage',
  'android',
  'local_repo',
  'org', 'asyncstorage', 'shared_storage', 'storage-android', '1.0.0',
  'storage-android-1.0.0.module'
);

if (!fs.existsSync(moduleFilePath)) {
  console.log('[patch-async-storage] storage-android-1.0.0.module not found, skipping patch 3.');
} else {
  let moduleContent;
  try {
    moduleContent = JSON.parse(fs.readFileSync(moduleFilePath, 'utf8'));
  } catch (e) {
    console.warn('[patch-async-storage] WARNING: Could not parse storage-android-1.0.0.module, skipping patch 3.');
    moduleContent = null;
  }

  if (moduleContent && moduleContent.component && moduleContent.component.url) {
    // Remove the broken redirect URL and fix the component identity to match this artifact.
    // Without "url", Gradle treats this .module file as the authoritative component
    // description and stops trying to follow the redirect to the missing storage:1.0.0 module.
    delete moduleContent.component.url;
    moduleContent.component.module = 'storage-android';
    fs.writeFileSync(moduleFilePath, JSON.stringify(moduleContent, null, 2), 'utf8');
    console.log('[patch-async-storage] Patched: removed broken component.url from storage-android-1.0.0.module.');
  } else {
    console.log('[patch-async-storage] storage-android-1.0.0.module already patched or has no component.url, skipping.');
  }
}
