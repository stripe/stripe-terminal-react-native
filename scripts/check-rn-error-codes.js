'use strict';

/**
 * Error Code Consistency Checker
 *
 * PURPOSE:
 * Validates that native platform error code mappings (iOS Swift, Android Kotlin)
 * are consistent with the TypeScript ErrorCode enum.
 *
 * WHEN THIS RUNS:
 * - Automatically on CI: Part of the 'lint' workflow in bitrise.yml
 *   → Runs on every PR and main branch push
 *   → Runs BEFORE linting to catch issues early
 * - Run manually: `yarn check:rn-error-codes` or `node scripts/check-rn-error-codes.js`
 *
 * WHY THIS MATTERS:
 * Native SDKs return platform-specific error codes that we map to a unified
 * RN ErrorCode enum. This script ensures:
 * 1. Exhaustive mapping: No default/else cases in switch/when statements
 *    → Forces compiler to catch missing cases when new native errors are added
 * 2. Valid mappings: All returned codes exist in TS ErrorCode enum
 *    → Prevents typos and invalid error codes from reaching users
 *
 * WHAT IT CHECKS:
 * - TypeScript: src/Errors/ErrorCodes.ts (source of truth)
 *   Example: export const ErrorCode = { READER_BUSY: 'READER_BUSY', ... }
 *
 * - iOS: ios/Errors.swift (convertToReactNativeErrorCode function)
 *   ✅ Good: switch code { case .readerBusy: return RNErrorCode.READER_BUSY.rawValue }
 *   ❌ Bad:  switch code { case .readerBusy: return "READER_BUZY" } // typo
 *   ❌ Bad:  switch code { ... default: return "UNEXPECTED" } // has default case
 *
 * - Android: android/.../Errors.kt (convertToReactNativeErrorCode function)
 *   ✅ Good: when (this) { TerminalErrorCode.READER_BUSY -> "READER_BUSY" }
 *   ❌ Bad:  when (this) { TerminalErrorCode.READER_BUSY -> "READER_BUZY" } // typo
 *   ❌ Bad:  when (this) { ... else -> "UNEXPECTED" } // has else branch
 *
 * FAILURE SCENARIOS:
 * ❌ Platform mapping has default/else case → Remove it for exhaustive checking
 * ❌ Platform returns invalid code → Fix typo or add to TS ErrorCode enum
 */

const fs = require('fs');
const path = require('path');

const REGEX_PATTERNS = {
  TS_ERROR_CODE_OBJECT: /export const ErrorCode = \{([\s\S]*?)\}\s+as const;/,
  TS_ERROR_CODE_ENTRY: /([A-Z0-9_]+)\s*:\s*'\1'/g,
  IOS_SWITCH_FUNCTION:
    /private\s+class\s+func\s+convertToReactNativeErrorCode\(from\s+code:\s*ErrorCode\.Code\)\s*->\s*String\s*\{\s*switch\s+code\s*\{([\s\S]*?)\}/,
  IOS_DEFAULT_CASE: /default\s*:/,
  IOS_RETURN_CODE:
    /case\s+\.[a-zA-Z0-9_]+\s*:\s*return\s+RNErrorCode\.([A-Z0-9_]+)\.rawValue/g,
  ANDROID_WHEN_FUNCTION:
    /fun\s+TerminalErrorCode\.convertToReactNativeErrorCode\([^)]*\)\s*:\s*String\s*=\s*when\s*\(this\)\s*\{([\s\S]*?)\}/,
  ANDROID_ELSE_BRANCH: /else\s*->/,
  ANDROID_RETURN_CODE: /->\s*"([A-Z0-9_]+)"/g,
};

function readSourceFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

function extractCodesFromMatches(regex, source) {
  const codes = new Set();
  let match;
  while ((match = regex.exec(source))) {
    codes.add(match[1]);
  }
  return codes;
}

function extractErrorCodeObject(src) {
  const match = src.match(REGEX_PATTERNS.TS_ERROR_CODE_OBJECT);
  if (!match) {
    throw new Error('Could not find ErrorCode object in TypeScript');
  }
  return match[1];
}

function extractErrorCodeNames(errorCodeBody) {
  return extractCodesFromMatches(
    REGEX_PATTERNS.TS_ERROR_CODE_ENTRY,
    errorCodeBody
  );
}

function parseTypeScriptErrorCodes(tsPath) {
  const src = readSourceFile(tsPath);
  const errorCodeBody = extractErrorCodeObject(src);
  return extractErrorCodeNames(errorCodeBody);
}

function extractSwiftSwitchStatement(src) {
  const match = src.match(REGEX_PATTERNS.IOS_SWITCH_FUNCTION);
  if (!match) {
    throw new Error('Could not find convertToReactNativeErrorCode in iOS');
  }
  return match[1];
}

function extractKotlinWhenExpression(src) {
  const match = src.match(REGEX_PATTERNS.ANDROID_WHEN_FUNCTION);
  if (!match) {
    throw new Error('Could not find convertToReactNativeErrorCode in Android');
  }
  return match[1];
}

function hasSwiftDefaultCase(switchBody) {
  return REGEX_PATTERNS.IOS_DEFAULT_CASE.test(switchBody);
}

function hasKotlinElseBranch(whenBody) {
  return REGEX_PATTERNS.ANDROID_ELSE_BRANCH.test(whenBody);
}

function extractSwiftReturnedCodes(switchBody) {
  return extractCodesFromMatches(REGEX_PATTERNS.IOS_RETURN_CODE, switchBody);
}

function extractKotlinReturnedCodes(whenBody) {
  return extractCodesFromMatches(REGEX_PATTERNS.ANDROID_RETURN_CODE, whenBody);
}

function parseIosPlatformMapping(filePath) {
  const src = readSourceFile(filePath);
  const switchBody = extractSwiftSwitchStatement(src);

  return {
    platform: 'ios',
    hasDefaultCase: hasSwiftDefaultCase(switchBody),
    returnedCodes: extractSwiftReturnedCodes(switchBody),
  };
}

function parseAndroidPlatformMapping(filePath) {
  const src = readSourceFile(filePath);
  const whenBody = extractKotlinWhenExpression(src);

  return {
    platform: 'android',
    hasDefaultCase: hasKotlinElseBranch(whenBody),
    returnedCodes: extractKotlinReturnedCodes(whenBody),
  };
}

function parsePlatformMapping(filePath, platform) {
  if (platform === 'ios') {
    return parseIosPlatformMapping(filePath);
  } else if (platform === 'android') {
    return parseAndroidPlatformMapping(filePath);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
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
      `❌ ${platformName} mapping returns codes not in TS ErrorCode:`
    );
    invalidCodes.forEach((code) => console.error(`   - ${code}`));
    return true;
  }

  console.log(
    `✅ All ${platformName} mapping return values exist in TS ErrorCode`
  );
  return false;
}

function checkPlatformMapping(platformMapping, tsErrorCodes) {
  const { platform, hasDefaultCase, returnedCodes } = platformMapping;

  const exhaustivenessError = reportExhaustivenessCheck(
    platform,
    hasDefaultCase
  );
  const invalidCodes = findInvalidCodes(returnedCodes, tsErrorCodes);
  const validityError = reportCodeValidityCheck(platform, invalidCodes);

  return exhaustivenessError || validityError;
}

function getFilePaths(repoRoot) {
  return {
    typescript: path.join(repoRoot, 'src', 'Errors', 'ErrorCodes.ts'),
    ios: path.join(repoRoot, 'ios', 'Errors.swift'),
    android: path.join(
      repoRoot,
      'android',
      'src',
      'main',
      'java',
      'com',
      'stripeterminalreactnative',
      'Errors.kt'
    ),
  };
}

function parseTypeScriptErrorCodesOrExit(tsPath) {
  try {
    const tsErrorCodes = parseTypeScriptErrorCodes(tsPath);
    console.log(`📋 Found ${tsErrorCodes.size} TypeScript ErrorCodes`);
    return tsErrorCodes;
  } catch (error) {
    console.error('❌ Failed to parse TypeScript ErrorCodes:', error.message);
    process.exit(1);
  }
}

function checkSinglePlatform(platform, filePath, tsErrorCodes) {
  const platformName = getPlatformDisplayName(platform);

  try {
    const platformMapping = parsePlatformMapping(filePath, platform);
    return checkPlatformMapping(platformMapping, tsErrorCodes);
  } catch (error) {
    console.error(`❌ ${platformName} mapping check failed:`, error.message);
    return true;
  }
}

function checkAllPlatforms(paths, tsErrorCodes) {
  const platforms = ['ios', 'android'];
  let hasErrors = false;

  platforms.forEach((platform, index) => {
    const stepNumber = index + 1;
    const platformName = getPlatformDisplayName(platform);

    console.log(
      `${stepNumber}️⃣  Checking ${platformName} error code mapping...`
    );

    if (checkSinglePlatform(platform, paths[platform], tsErrorCodes)) {
      hasErrors = true;
    }

    console.log('');
  });

  return hasErrors;
}

function reportFinalResult(hasErrors) {
  if (hasErrors) {
    console.error(
      '❌ Error code implementation has issues that need attention'
    );
    process.exit(1);
  }

  console.log('🎉 All error code implementation checks passed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   ✅ Exhaustive mapping ensures compiler-time checking');
  console.log('   ✅ All mapping return values are valid TS ErrorCodes');
  console.log('');
  console.log('💡 Note: This script trusts the compiler to ensure all');
  console.log('   ErrorCodes are handled. Focus is on runtime validation.');
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const paths = getFilePaths(repoRoot);

  console.log('🔍 Checking error code implementation quality...');
  console.log('');

  const tsErrorCodes = parseTypeScriptErrorCodesOrExit(paths.typescript);
  console.log('');

  const hasErrors = checkAllPlatforms(paths, tsErrorCodes);
  reportFinalResult(hasErrors);
}

main();
