'use strict';

// Run with: node --test .github/scripts/pack-npm.test.cjs

const assert = require('assert/strict');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const {
  PACKAGE_NAME,
  QA_PACKAGE_NAME,
  inspectTarball,
  normalizeRepository,
  parseArgs,
  resolveTargetIdentity,
  sha256,
  validateOriginalManifest,
  validateOutputDir,
} = require('./pack-npm.cjs');

const SOURCE_ROOT = path.resolve(__dirname, '..', '..');
const SHA = 'a'.repeat(40);
const PKG = {
  name: PACKAGE_NAME,
  version: '0.0.1-beta.34',
  repository: 'https://github.com/stripe/stripe-terminal-react-native',
  publishConfig: { registry: 'https://registry.npmjs.org/' },
};
const PROD_IDENTITY = { name: PACKAGE_NAME, version: PKG.version };

function args(overrides) {
  const values = {
    '--target': 'npm-qa',
    '--source-sha': SHA,
    '--output-dir': '/tmp/out',
    '--run-id': '123',
    '--run-attempt': '1',
    ...overrides,
  };
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .flat();
}

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-npm-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

// Builds a fixture tarball with the system tar, like the helper reads it.
// Pass pkg: null to omit package.json.
function tarball(t, pkg = PKG) {
  const dir = tempDir(t);
  fs.mkdirSync(path.join(dir, 'package'));
  fs.writeFileSync(path.join(dir, 'package', 'index.js'), '// file');
  if (pkg) {
    fs.writeFileSync(
      path.join(dir, 'package', 'package.json'),
      JSON.stringify(pkg)
    );
  }
  const tarballPath = path.join(dir, 'package.tgz');
  childProcess.execFileSync(
    'tar',
    ['-czf', tarballPath, '-C', dir, 'package'],
    { env: { ...process.env, COPYFILE_DISABLE: '1' } }
  );
  return tarballPath;
}

test('parseArgs accepts QA and production requests', () => {
  assert.deepEqual(parseArgs(args()), {
    target: 'npm-qa',
    sourceSha: SHA,
    outputDir: '/tmp/out',
    runId: '123',
    runAttempt: '1',
  });
  assert.equal(
    parseArgs(
      args({ '--target': 'npm-prod', '--expected-version': '0.0.1-beta.34' })
    ).expectedVersion,
    '0.0.1-beta.34'
  );
});

test('parseArgs rejects malformed requests', () => {
  const cases = [
    [args({ '--target': 'npm' }), /--target/],
    [args({ '--target': undefined }), /--target/],
    [args({ '--source-sha': 'abc123' }), /--source-sha/],
    [args({ '--source-sha': 'A'.repeat(40) }), /--source-sha/],
    [args({ '--output-dir': undefined }), /--output-dir/],
    [args({ '--run-id': '0' }), /--run-id/],
    [args({ '--run-id': '0123' }), /--run-id/],
    [args({ '--run-id': '12a' }), /--run-id/],
    [args({ '--run-attempt': undefined }), /--run-attempt/],
    [args({ '--run-attempt': '-1' }), /--run-attempt/],
    [args({ '--expected-version': '0.0.1-beta.34' }), /npm-qa does not accept/],
    [args({ '--target': 'npm-prod' }), /npm-prod requires --expected-version/],
    [[...args(), '--registry', 'https://example.com/'], /Unknown argument/],
    [[...args(), '--target', 'npm-prod'], /Duplicate argument/],
    [[...args(), '--expected-version'], /Missing value/],
    [['--target', '--source-sha', SHA], /Missing value/],
  ];
  for (const [argv, error] of cases) {
    assert.throws(() => parseArgs(argv), error, argv.join(' '));
  }
});

test('validateOriginalManifest accepts the checked-in package.json', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(SOURCE_ROOT, 'package.json'), 'utf8')
  );
  validateOriginalManifest(pkg);
});

test('normalizeRepository accepts equivalent forms of the SDK repository', () => {
  const forms = [
    'https://github.com/stripe/stripe-terminal-react-native',
    'https://github.com/stripe/stripe-terminal-react-native/',
    'https://github.com/stripe/stripe-terminal-react-native.git',
    'git+https://github.com/stripe/stripe-terminal-react-native.git',
    'git+ssh://git@github.com/stripe/stripe-terminal-react-native.git',
    'ssh://git@github.com:22/stripe/stripe-terminal-react-native.git',
    'git@github.com:stripe/stripe-terminal-react-native.git',
    'git://github.com/stripe/stripe-terminal-react-native.git',
    'github:stripe/stripe-terminal-react-native',
    'stripe/stripe-terminal-react-native',
    'https://github.com/Stripe/Stripe-Terminal-React-Native',
    {
      type: 'git',
      url: 'git+https://github.com/stripe/stripe-terminal-react-native.git',
    },
    {
      type: 'git',
      url: 'https://github.com/stripe/stripe-terminal-react-native',
      directory: 'packages/sdk',
    },
  ];
  for (const repository of forms) {
    assert.equal(
      normalizeRepository(repository),
      'github.com/stripe/stripe-terminal-react-native',
      JSON.stringify(repository)
    );
    validateOriginalManifest({ ...PKG, repository });
  }
});

test('validateOriginalManifest accepts harmless publication metadata', () => {
  const cases = [
    { private: false },
    { publishConfig: undefined },
    {
      publishConfig: {
        registry: 'https://registry.npmjs.org/',
        access: 'public',
      },
    },
    // The workflow's explicit flags override these publishConfig settings.
    { publishConfig: { tag: 'next', access: 'restricted', provenance: false } },
    { publishConfig: { registry: 'https://example.com/' } },
    { publishConfig: { '@stripe:registry': 'https://registry.npmjs.org' } },
    { publishConfig: { '@other:registry': 'https://example.com/' } },
  ];
  for (const overrides of cases) {
    validateOriginalManifest({ ...PKG, ...overrides });
  }
});

test('validateOriginalManifest rejects a different identity or publication target', () => {
  const cases = [
    [{ name: QA_PACKAGE_NAME }, /name/],
    [{ repository: undefined }, /repository/],
    [{ repository: { type: 'git' } }, /repository/],
    [
      { repository: 'https://github.com/example/stripe-terminal-react-native' },
      /repository/,
    ],
    [
      {
        repository:
          'https://github.com/stripe/stripe-terminal-react-native-fork',
      },
      /repository/,
    ],
    [
      { repository: 'https://gitlab.com/stripe/stripe-terminal-react-native' },
      /repository/,
    ],
    [
      { repository: 'gitlab:stripe/stripe-terminal-react-native' },
      /repository/,
    ],
    [{ private: true }, /private/],
    [
      { publishConfig: { '@stripe:registry': 'https://example.com/' } },
      /@stripe:registry/,
    ],
  ];
  for (const [overrides, error] of cases) {
    assert.throws(
      () => validateOriginalManifest({ ...PKG, ...overrides }),
      error,
      JSON.stringify(overrides)
    );
  }
});

test('resolveTargetIdentity gives QA a run-specific name and version', () => {
  const qa = { target: 'npm-qa', pkg: PKG, runId: '123', runAttempt: '1' };
  assert.deepEqual(resolveTargetIdentity(qa), {
    name: QA_PACKAGE_NAME,
    version: '0.0.1-beta.34-qa.123.1',
  });
  assert.equal(
    resolveTargetIdentity({ ...qa, runAttempt: '2' }).version,
    '0.0.1-beta.34-qa.123.2'
  );
  assert.equal(
    resolveTargetIdentity({ ...qa, pkg: { ...PKG, version: '1.2.3' } }).version,
    '1.2.3-qa.123.1'
  );
});

test('resolveTargetIdentity leaves production metadata unchanged', () => {
  const prod = {
    target: 'npm-prod',
    pkg: PKG,
    runId: '123',
    runAttempt: '1',
    expectedVersion: '0.0.1-beta.34',
  };
  assert.deepEqual(resolveTargetIdentity(prod), PROD_IDENTITY);
  assert.throws(
    () => resolveTargetIdentity({ ...prod, expectedVersion: '0.0.1-beta.35' }),
    /does not match expected version/
  );
  assert.throws(
    () => resolveTargetIdentity({ ...prod, expectedVersion: 'v0.0.1-beta.34' }),
    /does not match expected version/
  );
  assert.throws(
    () => resolveTargetIdentity({ ...prod, target: 'npm' }),
    /Unknown target/
  );
});

test('validateOutputDir accepts fresh directories outside the source', (t) => {
  const tmp = tempDir(t);
  validateOutputDir(tmp, SOURCE_ROOT);
  validateOutputDir(path.join(tmp, 'missing'), SOURCE_ROOT);
  validateOutputDir(path.join(tmp, 'a', 'b', 'c'), SOURCE_ROOT);
  validateOutputDir(`${SOURCE_ROOT}-pack-output`, SOURCE_ROOT);
  // `..` is fine when the resolved path stays outside the source.
  validateOutputDir([tmp, 'a', '..', 'out'].join(path.sep), SOURCE_ROOT);

  const outside = path.join(tmp, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(tmp, 'link-outside'));
  validateOutputDir(path.join(tmp, 'link-outside'), SOURCE_ROOT);
  validateOutputDir(path.join(tmp, 'link-outside', 'npm-out'), SOURCE_ROOT);
});

test('validateOutputDir rejects every path inside the source', (t) => {
  const tmp = tempDir(t);
  const linkToSource = path.join(tmp, 'link-source');
  fs.symlinkSync(path.join(SOURCE_ROOT, 'src'), linkToSource);

  const cases = [
    ['out', /absolute/],
    [SOURCE_ROOT, /outside/],
    [path.join(SOURCE_ROOT, 'src', 'npm-out'), /outside/],
    [path.join(SOURCE_ROOT, '..pack-output'), /outside/],
    [linkToSource, /outside/],
    [path.join(linkToSource, 'npm-out'), /outside/],
    [
      [SOURCE_ROOT, '..', path.basename(SOURCE_ROOT), 'out'].join(path.sep),
      /outside/,
    ],
  ];
  for (const [dir, error] of cases) {
    assert.throws(() => validateOutputDir(dir, SOURCE_ROOT), error, dir);
  }
});

test('validateOutputDir rejects dangling symlinks', (t) => {
  const tmp = tempDir(t);
  fs.symlinkSync(path.join(tmp, 'nowhere'), path.join(tmp, 'dangling'));
  assert.throws(
    () => validateOutputDir(path.join(tmp, 'dangling'), SOURCE_ROOT),
    /ENOENT/
  );
});

test('validateOutputDir requires an empty directory', (t) => {
  const tmp = tempDir(t);
  fs.writeFileSync(path.join(tmp, 'stale.tgz'), '');
  assert.throws(() => validateOutputDir(tmp, SOURCE_ROOT), /empty/);
  assert.throws(
    () => validateOutputDir(path.join(tmp, 'stale.tgz'), SOURCE_ROOT),
    /directory/
  );
});

test('inspectTarball accepts the intended package without extracting it', (t) => {
  const tarballPath = tarball(t);
  const before = fs.readdirSync(path.dirname(tarballPath)).sort();
  inspectTarball(tarballPath, PROD_IDENTITY);
  assert.deepEqual(fs.readdirSync(path.dirname(tarballPath)).sort(), before);

  // Package layout is not the helper's concern.
  inspectTarball(
    tarball(t, { ...PKG, exports: { '.': './missing.js' }, main: 'missing' }),
    PROD_IDENTITY
  );
});

test('inspectTarball rejects a different packed identity or publication target', (t) => {
  const cases = [
    [{ ...PKG, name: QA_PACKAGE_NAME }, /expected/],
    [{ ...PKG, version: '0.0.1-beta.35' }, /expected/],
    [{ ...PKG, private: true }, /private/],
    [{ ...PKG, repository: 'https://github.com/example/fork' }, /repository/],
    [
      { ...PKG, publishConfig: { '@stripe:registry': 'https://example.com/' } },
      /@stripe:registry/,
    ],
    [null, /missing package\/package.json/],
  ];
  for (const [pkg, error] of cases) {
    assert.throws(
      () => inspectTarball(tarball(t, pkg), PROD_IDENTITY),
      error,
      JSON.stringify(pkg)
    );
  }
});

test('inspectTarball rejects unreadable archives', (t) => {
  const corrupt = path.join(tempDir(t), 'package.tgz');
  fs.writeFileSync(corrupt, 'not a tarball');
  assert.throws(() => inspectTarball(corrupt, PROD_IDENTITY), /tar .* exited/);
});

test('sha256 returns a hex digest', () => {
  assert.equal(
    sha256(Buffer.from('')),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
});
