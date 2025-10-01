'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse TypeScript ErrorCode definitions
 */
function parseTypeScriptErrorCodes(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  const match = src.match(
    /export const ErrorCode = \{([\s\S]*?)\}\s+as const;/
  );
  if (!match) {
    throw new Error('Could not find ErrorCode object in TypeScript');
  }
  
  const body = match[1];
  const regex = /([A-Z0-9_]+)\s*:\s*'\1'/g;
  const errorCodes = new Set();
  let regexMatch;

  while ((regexMatch = regex.exec(body))) {
    errorCodes.add(regexMatch[1]);
  }

  return errorCodes;
}

/**
 * Parse platform error code mapping function and check for exhaustive handling
 */
function parsePlatformMapping(filePath, platform) {
  const src = fs.readFileSync(filePath, 'utf8');

  let functionMatch, hasDefaultCase, returnCodeRegex;

  if (platform === 'ios') {
    // Parse Swift convertToReactNativeErrorCode function
    functionMatch = src.match(
      /private\s+class\s+func\s+convertToReactNativeErrorCode\(from\s+code:\s*ErrorCode\.Code\)\s*->\s*String\s*\{\s*switch\s+code\s*\{([\s\S]*?)\}/
    );
    if (!functionMatch) {
      throw new Error(
        'Could not find convertToReactNativeErrorCode switch statement in iOS'
      );
    }

    hasDefaultCase = /default\s*:/.test(functionMatch[1]);
    returnCodeRegex =
      /case\s+\.[a-zA-Z0-9_]+\s*:\s*return\s+RNErrorCode\.([A-Z0-9_]+)\.rawValue/g;
  } else if (platform === 'android') {
    // Parse Kotlin convertToReactNativeErrorCode function
    functionMatch = src.match(
      /fun\s+TerminalErrorCode\.convertToReactNativeErrorCode\([^)]*\)\s*:\s*String\s*=\s*when\s*\(this\)\s*\{([\s\S]*?)\}/
    );
    if (!functionMatch) {
      throw new Error(
        'Could not find convertToReactNativeErrorCode when expression in Android'
      );
    }

    hasDefaultCase = /else\s*->/.test(functionMatch[1]);
    returnCodeRegex = /->\s*"([A-Z0-9_]+)"/g;
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Extract returned error codes
  const returnedCodes = new Set();
  let codeMatch;
  while ((codeMatch = returnCodeRegex.exec(functionMatch[1]))) {
    returnedCodes.add(codeMatch[1]);
  }

  return {
    platform,
    hasDefaultCase,
    returnedCodes,
  };
}

/**
 * Check platform mapping for exhaustive handling and valid return codes
 */
function checkPlatformMapping(platformMapping, tsErrorCodes) {
  const { platform, hasDefaultCase, returnedCodes } = platformMapping;
  const platformName = platform === 'ios' ? 'iOS' : 'Android';
  const defaultCaseName = platform === 'ios' ? 'default case' : 'else branch';

  let hasErrors = false;

  // Check for exhaustive mapping (no default/else case)
  if (hasDefaultCase) {
    console.error(`❌ ${platformName} mapping contains ${defaultCaseName}`);
    console.error(
      `   → Remove ${defaultCaseName} to ensure exhaustive checking`
    );
    hasErrors = true;
  } else {
    console.log(
      `✅ ${platformName} mapping is exhaustive (no ${defaultCaseName})`
    );
  }

  // Check that all returned codes exist in TypeScript ErrorCodes
  const invalidCodes = [...returnedCodes]
    .filter((code) => !tsErrorCodes.has(code))
    .sort();

  if (invalidCodes.length > 0) {
    console.error(
      `❌ ${platformName} mapping returns codes not present in TS ErrorCode:`
    );
    invalidCodes.forEach((code) => console.error(`   - ${code}`));
    hasErrors = true;
  } else {
    console.log(
      `✅ All ${platformName} mapping return values exist in TS ErrorCode`
    );
  }

  return hasErrors;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const paths = {
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

  console.log('🔍 Checking error code implementation quality...');
  console.log('');

  let hasErrors = false;

  // Parse TypeScript ErrorCodes for validation
  let tsErrorCodes;
  try {
    tsErrorCodes = parseTypeScriptErrorCodes(paths.typescript);
    console.log(`📋 Found ${tsErrorCodes.size} TypeScript ErrorCodes`);
  } catch (error) {
    console.error('❌ Failed to parse TypeScript ErrorCodes:', error.message);
    process.exit(1);
  }

  console.log('');

  // Check platform mappings
  const platforms = ['ios', 'android'];

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const stepNumber = i + 1;
    const platformName = platform === 'ios' ? 'iOS' : 'Android';

    console.log(
      `${stepNumber}️⃣  Checking ${platformName} error code mapping...`
    );

    try {
      const platformMapping = parsePlatformMapping(paths[platform], platform);
      const platformHasErrors = checkPlatformMapping(
        platformMapping,
        tsErrorCodes
      );

      if (platformHasErrors) {
        hasErrors = true;
      }
    } catch (error) {
      console.error(`❌ ${platformName} mapping check failed:`, error.message);
      hasErrors = true;
    }

    console.log('');
  }

  // Final result
  if (hasErrors) {
    console.error(
      '❌ Error code implementation has issues that need attention'
    );
    process.exit(1);
  } else {
    console.log('🎉 All error code implementation checks passed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Exhaustive mapping ensures compiler-time checking');
    console.log('   ✅ All mapping return values are valid TS ErrorCodes');
    console.log('');
    console.log('💡 Note: This script trusts the compiler to ensure all');
    console.log('   ErrorCodes are handled. Focus is on runtime validation.');
  }
}

main();
