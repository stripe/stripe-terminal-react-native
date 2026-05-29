'use strict';

/**
 * DeviceType Consistency Checker
 *
 * PURPOSE:
 * Validates that native platform DeviceType mappings (iOS Swift, Android Kotlin)
 * are consistent with the TypeScript DeviceType union type.
 *
 * WHEN THIS RUNS:
 * - Automatically on CI: Part of the 'lint' workflow in bitrise.yml
 *   → Runs on every PR and main branch push
 *   → Runs BEFORE linting to catch issues early
 * - Run manually: `yarn check:rn-device-types` or `node scripts/check-rn-device-types.js`
 *
 * WHY THIS MATTERS:
 * Native SDKs return platform-specific DeviceType enums that we map to unified
 * string values for the RN layer. This script ensures:
 * 1. Exhaustive mapping: No default/else cases in switch/when statements
 *    → Forces compiler to catch missing cases when new native device types are added
 * 2. Valid mappings: All returned DeviceType strings exist in TS DeviceType union
 *    → Prevents typos and invalid device types from reaching users
 *
 * WHAT IT CHECKS:
 * - TypeScript: src/types/Reader.ts (source of truth for DeviceType union)
 *   Example: export type DeviceType = 'chipper1X' | 'stripeM2' | ...
 *
 * - iOS: ios/Mappers.swift (mapFromDeviceType function)
 *   ✅ Good: switch type { case .stripeM2: return "stripeM2" }
 *   ❌ Bad:  switch type { case .stripeM2: return "stripem2" } // typo
 *   ❌ Bad:  switch type { ... default: return "unknown" } // has default case
 *
 * - Android: android/.../ReactNativeConstants.kt (DeviceSerialName enum)
 *            android/.../Mappers.kt (mapFromDeviceType function)
 *   ✅ Good: when (type) { DeviceType.STRIPE_M2 -> DeviceSerialName.STRIPE_M2.serialName }
 *   ❌ Bad:  when (type) { ... else -> "unknown" } // has else branch
 *
 * FAILURE SCENARIOS:
 * ❌ Platform mapping has default/else case → Remove it for exhaustive checking
 * ❌ Platform returns DeviceType string not in TS union → Fix typo or add to TS DeviceType
 */

const fs = require('fs');
const path = require('path');

const REGEX_PATTERNS = {
  TS_DEVICE_TYPE_UNION: /export type DeviceType\s*=\s*([\s\S]*?);/,
  TS_DEVICE_TYPE_VALUE: /'([a-zA-Z0-9]+)'/g,

  IOS_MAP_FROM_SWITCH:
    /class\s+func\s+mapFromDeviceType\(\s*_\s+type:\s*DeviceType\s*\)\s*->\s*String\s*\{\s*switch\s+type\s*\{([\s\S]*?)\n\s{4}\}/,
  IOS_DEFAULT_CASE: /default\s*:/,
  IOS_RETURN_STRING: /return\s+"([a-zA-Z0-9]+)"/g,

  ANDROID_DEVICE_SERIAL_ENUM:
    /enum\s+class\s+DeviceSerialName\(val\s+serialName:\s*String\)\s*\{([\s\S]*?)companion\s+object/,
  ANDROID_SERIAL_NAME_VALUE: /"([a-zA-Z0-9]+)"/g,
  ANDROID_MAP_FROM_WHEN:
    /internal\s+fun\s+mapFromDeviceType\(type:\s*DeviceType\)\s*:\s*String\s*\{\s*return\s+when\s*\(type\)\s*\{([\s\S]*?)\}\s*\}/,
  ANDROID_ELSE_BRANCH: /else\s*->/,
};

function findFile(dir, filename) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === filename) return fullPath;
    if (entry.isDirectory() && entry.name !== 'build') {
      const found = findFile(fullPath, filename);
      if (found) return found;
    }
  }
  return null;
}

function readSourceFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

function extractValuesFromMatches(regex, source) {
  const values = new Set();
  let match;
  const r = new RegExp(regex.source, regex.flags);
  while ((match = r.exec(source))) {
    values.add(match[1]);
  }
  return values;
}

function parseTypeScriptDeviceTypes(tsPath) {
  const src = readSourceFile(tsPath);
  const match = src.match(REGEX_PATTERNS.TS_DEVICE_TYPE_UNION);
  if (!match) {
    throw new Error('Could not find DeviceType union in TypeScript');
  }
  return extractValuesFromMatches(REGEX_PATTERNS.TS_DEVICE_TYPE_VALUE, match[1]);
}

function parseIosPlatformMapping(filePath) {
  const src = readSourceFile(filePath);
  const match = src.match(REGEX_PATTERNS.IOS_MAP_FROM_SWITCH);
  if (!match) {
    throw new Error('Could not find mapFromDeviceType in iOS Mappers.swift');
  }
  const switchBody = match[1];

  return {
    platform: 'ios',
    hasDefaultCase: REGEX_PATTERNS.IOS_DEFAULT_CASE.test(switchBody),
    returnedCodes: extractValuesFromMatches(
      REGEX_PATTERNS.IOS_RETURN_STRING,
      switchBody
    ),
  };
}

function parseAndroidPlatformMapping(constantsPath, mappersPath) {
  const constantsSrc = readSourceFile(constantsPath);
  const enumMatch = constantsSrc.match(
    REGEX_PATTERNS.ANDROID_DEVICE_SERIAL_ENUM
  );
  if (!enumMatch) {
    throw new Error(
      'Could not find DeviceSerialName enum in Android ReactNativeConstants.kt'
    );
  }
  const serialNames = extractValuesFromMatches(
    REGEX_PATTERNS.ANDROID_SERIAL_NAME_VALUE,
    enumMatch[1]
  );

  const mappersSrc = readSourceFile(mappersPath);
  const whenMatch = mappersSrc.match(REGEX_PATTERNS.ANDROID_MAP_FROM_WHEN);
  if (!whenMatch) {
    throw new Error(
      'Could not find mapFromDeviceType in Android Mappers.kt'
    );
  }

  return {
    platform: 'android',
    hasDefaultCase: REGEX_PATTERNS.ANDROID_ELSE_BRANCH.test(whenMatch[1]),
    returnedCodes: serialNames,
  };
}

function getPlatformDisplayName(platform) {
  return platform === 'ios' ? 'iOS' : 'Android';
}

function getDefaultCaseName(platform) {
  return platform === 'ios' ? 'default case' : 'else branch';
}

function findInvalidCodes(returnedCodes, validCodes) {
  return [...returnedCodes].filter((code) => !validCodes.has(code)).sort();
}

function reportExhaustivenessCheck(platform, hasDefaultCase) {
  const platformName = getPlatformDisplayName(platform);
  const defaultCaseName = getDefaultCaseName(platform);

  if (hasDefaultCase) {
    console.error(`❌ ${platformName} mapping contains ${defaultCaseName}`);
    console.error(
      `   → Remove ${defaultCaseName} to ensure exhaustive checking`
    );
    return true;
  }

  console.log(
    `✅ ${platformName} mapping is exhaustive (no ${defaultCaseName})`
  );
  return false;
}

function reportCodeValidityCheck(platform, invalidCodes) {
  const platformName = getPlatformDisplayName(platform);

  if (invalidCodes.length > 0) {
    console.error(
      `❌ ${platformName} mapping returns DeviceType strings not in TS DeviceType:`
    );
    invalidCodes.forEach((code) => console.error(`   - ${code}`));
    return true;
  }

  console.log(
    `✅ All ${platformName} DeviceType strings exist in TS DeviceType`
  );
  return false;
}

function checkPlatformMapping(platformMapping, tsDeviceTypes) {
  const { platform, hasDefaultCase, returnedCodes } = platformMapping;

  const exhaustivenessError = reportExhaustivenessCheck(
    platform,
    hasDefaultCase
  );
  const invalidCodes = findInvalidCodes(returnedCodes, tsDeviceTypes);
  const validityError = reportCodeValidityCheck(platform, invalidCodes);

  return exhaustivenessError || validityError;
}

function resolveAndroidFile(repoRoot, filename) {
  const androidDir = path.join(repoRoot, 'android');
  const found = findFile(androidDir, filename);
  if (!found) {
    throw new Error(
      `Could not find ${filename} under android/. ` +
      'This script checks DeviceType mapping consistency across platforms. ' +
      'Was the file renamed or removed?'
    );
  }
  const relativePath = path.relative(repoRoot, found);
  console.log(`   Found ${relativePath}`);
  return found;
}

function getFilePaths(repoRoot) {
  console.log('📂 Locating source files...');
  const paths = {
    typescript: path.join(repoRoot, 'src', 'types', 'Reader.ts'),
    ios: path.join(repoRoot, 'ios', 'Mappers.swift'),
    androidConstants: resolveAndroidFile(repoRoot, 'ReactNativeConstants.kt'),
    androidMappers: resolveAndroidFile(repoRoot, 'Mappers.kt'),
  };
  console.log('');
  return paths;
}

function parseTypeScriptDeviceTypesOrExit(tsPath) {
  try {
    const tsDeviceTypes = parseTypeScriptDeviceTypes(tsPath);
    console.log(`📋 Found ${tsDeviceTypes.size} TypeScript DeviceTypes`);
    return tsDeviceTypes;
  } catch (error) {
    console.error(
      '❌ Failed to parse TypeScript DeviceTypes:',
      error.message
    );
    process.exit(1);
  }
}

function checkIos(paths, tsDeviceTypes) {
  console.log('1️⃣  Checking iOS DeviceType mapping...');

  try {
    const platformMapping = parseIosPlatformMapping(paths.ios);
    const hasErrors = checkPlatformMapping(platformMapping, tsDeviceTypes);
    console.log('');
    return hasErrors;
  } catch (error) {
    console.error('❌ iOS mapping check failed:', error.message);
    console.log('');
    return true;
  }
}

function checkAndroid(paths, tsDeviceTypes) {
  console.log('2️⃣  Checking Android DeviceType mapping...');

  try {
    const platformMapping = parseAndroidPlatformMapping(
      paths.androidConstants,
      paths.androidMappers
    );
    const hasErrors = checkPlatformMapping(platformMapping, tsDeviceTypes);
    console.log('');
    return hasErrors;
  } catch (error) {
    console.error('❌ Android mapping check failed:', error.message);
    console.log('');
    return true;
  }
}

function reportFinalResult(hasErrors) {
  if (hasErrors) {
    console.error(
      '❌ DeviceType implementation has issues that need attention'
    );
    process.exit(1);
  }

  console.log('🎉 All DeviceType implementation checks passed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   ✅ Exhaustive mapping ensures compiler-time checking');
  console.log('   ✅ All mapping return values are valid TS DeviceTypes');
  console.log('');
  console.log('💡 Note: This script trusts the compiler to ensure all');
  console.log('   DeviceTypes are handled. Focus is on runtime validation.');
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const paths = getFilePaths(repoRoot);

  console.log('🔍 Checking DeviceType implementation consistency...');
  console.log('');

  const tsDeviceTypes = parseTypeScriptDeviceTypesOrExit(paths.typescript);
  console.log('');

  let hasErrors = false;
  if (checkIos(paths, tsDeviceTypes)) {
    hasErrors = true;
  }
  if (checkAndroid(paths, tsDeviceTypes)) {
    hasErrors = true;
  }

  reportFinalResult(hasErrors);
}

main();
