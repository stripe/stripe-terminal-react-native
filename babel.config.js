let fs = require('fs');
let babel = require('@babel/core');
let t = babel.types;

function readPackageJson() {
  return fs.readFileSync('./package.json', 'utf8');
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // This Babel plugin inlines the RN SDK's `package.json` directly into the
    // transpiled code in order to make it easier for downstream tooling (e.g.,
    // Metro bundler, or build-time config generators like Expo's) to locate
    // the SDK's `package.json` when the SDK is a symlinked dependency (e.g.,
    // via `yarn link`). Standard module resolution for `package.json` via its
    // own package name can fail in these contexts, as observed when Expo
    // config plugins attempt to require it during app prebuild. Inlining
    // ensures the data is present without file system lookups at bundle or
    // build time.
    function InlinePackageJsonPlugin() {
      return {
        visitor: {
          ImportDeclaration(path) {
            // Catches ES6 imports like: `import pkg from '../package.json';`
            if (path.node.source.value === '../package.json') {
              const importSpecifier = path.node.specifiers[0];
              if (importSpecifier) {
                const importedName = importSpecifier.local.name;

                // Replace the import statement with a variable declaration:
                // `const pkg = { /* parsed content of ./package.json */ };`
                path.replaceWith(
                  t.variableDeclaration('const', [
                    t.variableDeclarator(
                      t.identifier(importedName),
                      t.valueToNode(JSON.parse(readPackageJson()))
                    ),
                  ])
                );
              }
            }
          },

          CallExpression(path) {
            // Catches CommonJS requires like:
            // `const pkg = require('@stripe/stripe-terminal-react-native/package.json');`
            if (
              path.node.callee.type === 'Identifier' &&
              path.node.callee.name === 'require' &&
              path.node.arguments.length === 1 &&
              path.node.arguments[0].type === 'StringLiteral' &&
              path.node.arguments[0].value ===
                '@stripe/stripe-terminal-react-native/package.json'
            ) {
              // Replace the `require()` call with an object literal of the package.json content:
              // `({ /* raw string content of ./package.json, parsed by JS engine */ });`
              path.replaceWithSourceString(`(${readPackageJson()})`);
            }
          },
        },
      };
    },
  ],
};
