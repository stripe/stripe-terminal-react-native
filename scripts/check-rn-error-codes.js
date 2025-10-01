'use strict';

const fs = require('fs');
const path = require('path');

function parseTsErrorCodes(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  const m = src.match(/export const ErrorCode = \{([\s\S]*?)\}\s+as const;/);
  if (!m) {
    throw new Error('Could not find ErrorCode object in TS');
  }
  const body = m[1];
  const re = /([A-Z0-9_]+)\s*:\s*'\1'/g;
  const keys = new Set();
  let match;
  while ((match = re.exec(body))) {
    keys.add(match[1]);
  }
  return keys;
}

function parseSwiftEnum(swiftPath) {
  const src = fs.readFileSync(swiftPath, 'utf8');
  const m = src.match(/enum\s+RNErrorCode\s*:\s*String\s*\{([\s\S]*?)\}/);
  if (!m) {
    throw new Error('Could not find RNErrorCode enum in Swift');
  }
  const body = m[1];
  const re = /case\s+([A-Z0-9_]+)\s*=\s*"\1"/g;
  const keys = new Set();
  let match;
  while ((match = re.exec(body))) {
    keys.add(match[1]);
  }
  return keys;
}

function parseSwiftMapping(swiftPath) {
  const src = fs.readFileSync(swiftPath, 'utf8');
  const m = src.match(
    /private\s+class\s+func\s+convertToReactNativeErrorCode\(from\s+code:\s*ErrorCode\.Code\)\s*->\s*String\s*\{\s*switch\s+code\s*\{([\s\S]*?)\}/
  );
  if (!m) {
    throw new Error(
      'Could not find convertToReactNativeErrorCode switch statement in Swift'
    );
  }
  const body = m[1];
  const hasDefaultBranch = /default\s*:/.test(body);
  const re = /case\s+\.[a-zA-Z0-9_]+\s*:\s*return\s+RNErrorCode\.([A-Z0-9_]+)\.rawValue/g;
  const codes = new Set();
  let match;
  while ((match = re.exec(body))) {
    codes.add(match[1]);
  }
  return { codes, hasDefaultCase: hasDefaultBranch };
}

function parseAndroidMapping(kotlinPath) {
  const src = fs.readFileSync(kotlinPath, 'utf8');
  const m = src.match(
    /fun\s+TerminalErrorCode\.convertToReactNativeErrorCode\([^)]*\)\s*:\s*String\s*=\s*when\s*\(this\)\s*\{([\s\S]*?)\}/
  );
  if (!m) {
    throw new Error(
      'Could not find TerminalErrorCode.convertToReactNativeErrorCode() in Kotlin'
    );
  }
  const body = m[1];
  const hasElseBranch = /else\s*->/.test(body);
  const re = /->\s*"([A-Z0-9_]+)"/g;
  const codes = new Set();
  let match;
  while ((match = re.exec(body))) {
    codes.add(match[1]);
  }
  return { codes, hasDefaultCase: hasElseBranch };
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const tsPath = path.join(repoRoot, 'src', 'Errors', 'ErrorCodes.ts');
  const swiftPath = path.join(repoRoot, 'ios', 'Errors.swift');
  const kotlinPath = path.join(
    repoRoot,
    'android',
    'src',
    'main',
    'java',
    'com',
    'stripeterminalreactnative',
    'Errors.kt'
  );

  const tsKeys = parseTsErrorCodes(tsPath);
  const swiftKeys = parseSwiftEnum(swiftPath);
  const swiftMapping = parseSwiftMapping(swiftPath);
  const androidMapping = parseAndroidMapping(kotlinPath);

  const missingInSwift = [...tsKeys].filter((k) => !swiftKeys.has(k)).sort();
  const extraInSwift = [...swiftKeys].filter((k) => !tsKeys.has(k)).sort();

  const androidReturnsNotInTs = [...androidMapping.codes]
    .filter((k) => !tsKeys.has(k))
    .sort();

  // Check TS and Swift enum sync
  if (missingInSwift.length || extraInSwift.length) {
    console.error('RN ErrorCode mismatch found:');
    if (missingInSwift.length) {
      console.error('\nMissing in Swift RNErrorCode:');
      missingInSwift.forEach((k) => console.error('  - ' + k));
    }
    if (extraInSwift.length) {
      console.error('\nExtra in Swift RNErrorCode (not in TS):');
      extraInSwift.forEach((k) => console.error('  - ' + k));
    }
    process.exit(1);
  } else {
    console.log('RN ErrorCode: TS and Swift are in sync.');
  }

  // Check Swift switch statement has no default
  if (swiftMapping.hasDefaultCase) {
    console.error(
      '\nSwift Errors.swift convertToReactNativeErrorCode switch contains a default branch; expected exhaustive switch without default.'
    );
    process.exit(1);
  } else {
    console.log('Swift mapping: exhaustive switch (no default) confirmed.');
  }

  // Android mapping checks
  if (androidMapping.hasDefaultCase) {
    console.error(
      '\nAndroid Errors.kt mapping contains an else branch; expected exhaustive when without else.'
    );
    process.exit(1);
  }
  if (androidReturnsNotInTs.length) {
    console.error(
      '\nAndroid Errors.kt returns codes not present in TS ErrorCode:'
    );
    androidReturnsNotInTs.forEach((k) => console.error('  - ' + k));
    process.exit(1);
  }
  console.log(
    'Android mapping: exhaustive when (no else) and all return codes exist in TS.'
  );
}

main();
