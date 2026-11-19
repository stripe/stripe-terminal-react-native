'use strict';

/**
 * API Reference Coverage Checker
 *
 * PURPOSE:
 * Validates that the TypeDoc API reference covers the SDK's public API surface.
 *
 * WHEN THIS RUNS:
 * - Run manually after `yarn docs`: `yarn check:docs`
 *
 * WHAT IT CHECKS:
 * - Every export of src/index.tsx, including namespace members, has a page in
 *   build/typedoc/api.json, and nothing is documented that isn't exported.
 *   Exports tagged `@internal`, `@ignore` or `@hidden` are skipped, as TypeDoc
 *   leaves them out.
 * - Every member returned by useStripeTerminal (WithStripeTerminalProps) is
 *   documented and has a description.
 * - The StripeTerminalSdkType redirect target exists, since the redirect page
 *   is copied in by `yarn docs` and would otherwise break silently.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const ENTRY_POINT = path.join(ROOT, 'src/index.tsx');
const TSCONFIG = path.join(ROOT, 'tsconfig.build.json');
const API_JSON = path.join(ROOT, 'build/typedoc/api.json');
const REDIRECT_TARGET = path.join(
  ROOT,
  'docs/api-reference/interfaces/WithStripeTerminalProps.html'
);
const HOOK_RESULT_TYPE = 'WithStripeTerminalProps';
// TypeDoc reflection kind for namespaces.
const KIND_NAMESPACE = 4;

function createProgram() {
  const { config, error } = ts.readConfigFile(TSCONFIG, ts.sys.readFile);
  if (error) {
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  }
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, ROOT);
  return ts.createProgram([ENTRY_POINT], options);
}

const HIDDEN_TAGS = new Set(['internal', 'ignore', 'hidden']);

function hasFlag(symbol, flag) {
  // eslint-disable-next-line no-bitwise
  return (symbol.flags & flag) !== 0;
}

function resolveAlias(symbol, checker) {
  return hasFlag(symbol, ts.SymbolFlags.Alias)
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

function isHidden(symbol, checker) {
  return resolveAlias(symbol, checker)
    .getJsDocTags(checker)
    .some((tag) => HIDDEN_TAGS.has(tag.name));
}

function collectExports(moduleSymbol, checker, prefix, out) {
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    if (isHidden(symbol, checker)) continue;
    const name = prefix + symbol.getName();
    out.add(name);
    const target = resolveAlias(symbol, checker);
    if (
      hasFlag(target, ts.SymbolFlags.Module) &&
      !hasFlag(target, ts.SymbolFlags.Enum)
    ) {
      collectExports(target, checker, `${name}.`, out);
    }
  }
  return out;
}

function collectHookMembers(moduleSymbol, checker) {
  const symbol = checker
    .getExportsOfModule(moduleSymbol)
    .find((s) => s.getName() === HOOK_RESULT_TYPE);
  const type = checker.getDeclaredTypeOfSymbol(
    checker.getAliasedSymbol(symbol)
  );
  return checker.getPropertiesOfType(type).map((p) => p.getName());
}

function collectDocumented(reflections, prefix, out) {
  for (const reflection of reflections || []) {
    const name = prefix + reflection.name;
    out.add(name);
    if (reflection.kind === KIND_NAMESPACE) {
      collectDocumented(reflection.children, `${name}.`, out);
    }
  }
  return out;
}

function hasDescription(reflection) {
  const comment =
    reflection.comment || reflection.signatures?.[0]?.comment || {};
  return (comment.summary || []).some((part) => part.text.trim() !== '');
}

function main() {
  if (!fs.existsSync(API_JSON)) {
    console.error(
      `🛑 ${path.relative(ROOT, API_JSON)} not found. Run \`yarn docs\` first.`
    );
    process.exit(1);
  }
  const api = JSON.parse(fs.readFileSync(API_JSON, 'utf8'));

  const program = createProgram();
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(
    program.getSourceFile(ENTRY_POINT)
  );

  const exported = collectExports(moduleSymbol, checker, '', new Set());
  const documented = collectDocumented(api.children, '', new Set());
  const errors = [];

  for (const name of exported) {
    if (!documented.has(name))
      errors.push(`Exported but not documented: ${name}`);
  }
  for (const name of documented) {
    if (!exported.has(name))
      errors.push(`Documented but not exported: ${name}`);
  }

  const hookReflection = api.children.find((c) => c.name === HOOK_RESULT_TYPE);
  const hookDocs = new Map(
    (hookReflection?.children || []).map((c) => [c.name, c])
  );
  for (const member of collectHookMembers(moduleSymbol, checker)) {
    const reflection = hookDocs.get(member);
    if (!reflection) {
      errors.push(`${HOOK_RESULT_TYPE}.${member} is not documented`);
    } else if (!hasDescription(reflection)) {
      errors.push(`${HOOK_RESULT_TYPE}.${member} has no description`);
    }
  }

  if (!fs.existsSync(REDIRECT_TARGET)) {
    errors.push(
      `Redirect target ${path.relative(ROOT, REDIRECT_TARGET)} is missing; ` +
        'update docs/redirects/StripeTerminalSdkType.html'
    );
  }

  if (errors.length > 0) {
    console.error('🛑 API reference does not match the public API:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(
    `✅ API reference covers ${exported.size} exports and ${hookDocs.size} ${HOOK_RESULT_TYPE} members`
  );
}

main();
