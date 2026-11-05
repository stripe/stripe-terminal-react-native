#!/usr/bin/env node
'use strict';

/**
 * Builds the npm tarball for the Terminal RN publish workflow
 * (.github/workflows/terminal-rn-publish.yml).
 *
 * Usage (from inside the repository):
 *   node .github/scripts/pack-npm.cjs \
 *     --target npm-qa|npm-prod \
 *     --source-sha <checked-out commit> \
 *     --output-dir <fresh absolute directory outside the source tree> \
 *     --run-id <n> --run-attempt <n> \
 *     [--expected-version <version>]   # npm-prod only
 *
 * Writes <output-dir>/package.tgz and <output-dir>/manifest.json
 * ({package_name, version, source_sha, sha256}). npm-qa temporarily renames the
 * package and gives it a run-specific prerelease version; npm-prod packs the
 * checked-in manifest unchanged after checking it matches --expected-version.
 *
 * The helper only builds the package, checks that it carries the intended
 * identity, and records the digest of the exact bytes to publish. npm remains
 * the package-format validator. It never selects source, talks to GitHub,
 * publishes, or handles credentials.
 */

const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PACKAGE_NAME = '@stripe/stripe-terminal-react-native';
const QA_PACKAGE_NAME = '@stripe/stripe-terminal-react-native-qa';
const REPOSITORY = 'github.com/stripe/stripe-terminal-react-native';
const REGISTRY = 'https://registry.npmjs.org/';
const TARGETS = ['npm-qa', 'npm-prod'];
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const GIT_SHA = /^[0-9a-f]{40}$/;

const FLAGS = {
  '--target': 'target',
  '--source-sha': 'sourceSha',
  '--output-dir': 'outputDir',
  '--run-id': 'runId',
  '--run-attempt': 'runAttempt',
  '--expected-version': 'expectedVersion',
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const key = FLAGS[flag];
    if (!key) {
      throw new Error(`Unknown argument: ${flag}`);
    }
    if (key in args) {
      throw new Error(`Duplicate argument: ${flag}`);
    }
    const value = argv[i + 1];
    if (value === undefined || value === '' || value.startsWith('--')) {
      throw new Error(`Missing value for ${flag}`);
    }
    args[key] = value;
  }

  if (!TARGETS.includes(args.target)) {
    throw new Error(`--target must be one of ${TARGETS.join(', ')}`);
  }
  if (!GIT_SHA.test(args.sourceSha || '')) {
    throw new Error('--source-sha must be a full lowercase commit SHA');
  }
  if (!args.outputDir) {
    throw new Error('--output-dir is required');
  }
  for (const key of ['runId', 'runAttempt']) {
    if (!POSITIVE_INTEGER.test(args[key] || '')) {
      throw new Error(
        `--${
          key === 'runId' ? 'run-id' : 'run-attempt'
        } must be a positive integer`
      );
    }
  }
  if (args.target === 'npm-prod') {
    if (args.expectedVersion === undefined) {
      throw new Error('npm-prod requires --expected-version');
    }
  } else if (args.expectedVersion !== undefined) {
    throw new Error('npm-qa does not accept --expected-version');
  }
  return args;
}

// Reduces the repository forms npm accepts (object or string; https, git+,
// ssh, scp-style, github: and owner/name shorthands) to host/owner/name.
function normalizeRepository(repository) {
  const url =
    typeof repository === 'string' ? repository : repository && repository.url;
  if (typeof url !== 'string') {
    return null;
  }
  let normalized = url
    .trim()
    .replace(/^git\+/, '')
    .replace(/^github:/, '');
  if (/^[\w.-]+\/[\w.-]+$/.test(normalized)) {
    normalized = `github.com/${normalized}`;
  }
  return normalized
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^[^@/]+@/, '')
    .replace(/^([^/:]+):(\d+\/)?/, '$1/')
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
    .toLowerCase();
}

// Rejects only metadata that would change where or whether this package is
// published. The workflow's explicit --registry/--access/--tag/--provenance
// flags take precedence over publishConfig, except for a scoped registry.
function validatePublication(pkg, label) {
  if (normalizeRepository(pkg.repository) !== REPOSITORY) {
    throw new Error(`${label} repository must point to https://${REPOSITORY}`);
  }
  if (pkg.private === true) {
    throw new Error(`${label} must not be private`);
  }
  const scopedRegistry =
    pkg.publishConfig && pkg.publishConfig['@stripe:registry'];
  if (
    scopedRegistry !== undefined &&
    String(scopedRegistry).replace(/\/*$/, '/') !== REGISTRY
  ) {
    throw new Error(
      `${label} publishConfig @stripe:registry must be ${REGISTRY}`
    );
  }
}

function validateOriginalManifest(pkg) {
  if (pkg.name !== PACKAGE_NAME) {
    throw new Error(`package.json name must be ${PACKAGE_NAME}`);
  }
  validatePublication(pkg, 'package.json');
}

function resolveTargetIdentity({
  target,
  pkg,
  runId,
  runAttempt,
  expectedVersion,
}) {
  if (target === 'npm-qa') {
    return {
      name: QA_PACKAGE_NAME,
      version: `${pkg.version}-qa.${runId}.${runAttempt}`,
    };
  }
  if (target === 'npm-prod') {
    if (pkg.version !== expectedVersion) {
      throw new Error(
        `package.json version ${pkg.version} does not match expected version ${expectedVersion}`
      );
    }
    return { name: pkg.name, version: pkg.version };
  }
  throw new Error(`Unknown target: ${target}`);
}

// Resolves symlinks in the deepest existing ancestor; missing components are
// appended unchanged. A dangling symlink makes realpathSync throw.
function resolveRealPath(target) {
  const missing = [];
  let current = target;
  for (;;) {
    try {
      fs.lstatSync(current);
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    missing.unshift(path.basename(current));
    current = path.dirname(current);
  }
  return path.join(fs.realpathSync(current), ...missing);
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === '' ||
    (!path.isAbsolute(relative) && relative.split(path.sep)[0] !== '..')
  );
}

function validateOutputDir(dir, sourceRoot) {
  if (!path.isAbsolute(dir)) {
    throw new Error('--output-dir must be an absolute path');
  }
  if (isWithin(fs.realpathSync(sourceRoot), resolveRealPath(dir))) {
    throw new Error('--output-dir must be outside the source tree');
  }
  if (fs.existsSync(dir)) {
    if (!fs.statSync(dir).isDirectory()) {
      throw new Error('--output-dir must be a directory');
    }
    if (fs.readdirSync(dir).length > 0) {
      throw new Error('--output-dir must be empty');
    }
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Reads package/package.json through the system tar without extracting the
// archive, and checks the packed identity.
function inspectTarball(tarballPath, { name, version }) {
  const entries = run('tar', ['-tzf', tarballPath]).split('\n');
  if (!entries.includes('package/package.json')) {
    throw new Error('Tarball is missing package/package.json');
  }
  const pkg = JSON.parse(
    run('tar', ['-xOzf', tarballPath, 'package/package.json'])
  );
  if (pkg.name !== name || pkg.version !== version) {
    throw new Error(
      `Tarball package is ${pkg.name}@${pkg.version}, expected ${name}@${version}`
    );
  }
  validatePublication(pkg, 'Tarball package.json');
}

function run(command, args, options) {
  const result = childProcess.spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with ${result.status}`
    );
  }
  return result.stdout;
}

function main(argv) {
  const args = parseArgs(argv);
  const sourceRoot = run('git', ['rev-parse', '--show-toplevel']).trim();
  const git = (...gitArgs) => run('git', gitArgs, { cwd: sourceRoot }).trim();

  if (git('rev-parse', 'HEAD') !== args.sourceSha) {
    throw new Error(`HEAD does not match --source-sha ${args.sourceSha}`);
  }
  if (git('status', '--porcelain') !== '') {
    throw new Error('Source tree must be clean before packing');
  }

  const packageJsonPath = path.join(sourceRoot, 'package.json');
  const lockfilePath = path.join(sourceRoot, 'yarn.lock');
  const originalPackageJson = fs.readFileSync(packageJsonPath);
  const lockfileHash = sha256(fs.readFileSync(lockfilePath));
  const checkLockfile = () => {
    if (sha256(fs.readFileSync(lockfilePath)) !== lockfileHash) {
      throw new Error('yarn.lock changed during packing');
    }
  };

  const pkg = JSON.parse(originalPackageJson.toString('utf8'));
  validateOriginalManifest(pkg);
  const identity = resolveTargetIdentity({ ...args, pkg });
  validateOutputDir(args.outputDir, sourceRoot);
  fs.mkdirSync(args.outputDir, { recursive: true });

  const diagnosticsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-npm-'));
  console.error(`pack-npm: npm diagnostics in ${diagnosticsDir}`);
  const env = {
    ...process.env,
    YARN_IGNORE_PATH: '1',
    npm_config_ignore_scripts: 'false',
    npm_config_cache: path.join(diagnosticsDir, 'cache'),
    npm_config_logs_dir: path.join(diagnosticsDir, 'logs'),
  };
  const childOptions = { cwd: sourceRoot, env };

  let packOutput;
  try {
    if (identity.name !== pkg.name || identity.version !== pkg.version) {
      // Must happen before install: `prepare` builds lib/, which reads the version.
      fs.writeFileSync(
        packageJsonPath,
        `${JSON.stringify({ ...pkg, ...identity }, null, 2)}\n`
      );
    }
    run('yarn', ['install', '--frozen-lockfile', '--non-interactive'], {
      ...childOptions,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    checkLockfile();
    packOutput = run(
      'npm',
      [
        'pack',
        '--json',
        '--foreground-scripts=false',
        '--pack-destination',
        args.outputDir,
      ],
      childOptions
    );
  } finally {
    fs.writeFileSync(packageJsonPath, originalPackageJson);
  }
  checkLockfile();
  if (git('status', '--porcelain') !== '') {
    throw new Error('Packing left changes in the source tree');
  }

  const packed = JSON.parse(packOutput);
  if (!Array.isArray(packed) || packed.length !== 1) {
    throw new Error('npm pack must produce exactly one tarball');
  }
  const filename = packed[0].filename;
  if (
    typeof filename !== 'string' ||
    path.basename(filename) !== filename ||
    !filename.endsWith('.tgz')
  ) {
    throw new Error(`Unexpected npm pack filename: ${filename}`);
  }
  const outputs = fs.readdirSync(args.outputDir);
  if (outputs.length !== 1 || outputs[0] !== filename) {
    throw new Error(
      `Unexpected output directory contents: ${outputs.join(', ')}`
    );
  }

  const tarballPath = path.join(args.outputDir, 'package.tgz');
  fs.renameSync(path.join(args.outputDir, filename), tarballPath);
  inspectTarball(tarballPath, identity);

  const manifest = {
    package_name: identity.name,
    version: identity.version,
    source_sha: args.sourceSha,
    sha256: sha256(fs.readFileSync(tarballPath)),
  };
  fs.writeFileSync(
    path.join(args.outputDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  fs.rmSync(diagnosticsDir, { recursive: true, force: true });
  console.log(
    `Packed ${manifest.package_name}@${manifest.version} from ${manifest.source_sha} (sha256 ${manifest.sha256})`
  );
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`pack-npm: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  PACKAGE_NAME,
  QA_PACKAGE_NAME,
  inspectTarball,
  normalizeRepository,
  parseArgs,
  resolveTargetIdentity,
  sha256,
  validateOriginalManifest,
  validateOutputDir,
};
