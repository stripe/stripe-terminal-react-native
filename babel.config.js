let fs = require('fs');
let babel = require('@babel/core');
let t = babel.types;

function readPackageJson() {
  return fs.readFileSync('./package.json', 'utf8');
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    function InlinePackageJsonPlugin() {
      return {
        visitor: {
          ImportDeclaration(path) {
            if (path.node.source.value === '../package.json') {
              const importSpecifier = path.node.specifiers[0];
              if (importSpecifier) {
                const importedName = importSpecifier.local.name;

                path.replaceWith(
                  t.variableDeclaration('const', [
                    t.variableDeclarator(
                      t.identifier(importedName),
                      t.valueToNode(JSON.parse(readPackageJson()))
                    )
                  ])
                );
              }
            }
          },

          CallExpression(path) {
            if (
              path.node.callee.type === 'Identifier' &&
              path.node.callee.name === 'require' &&
              path.node.arguments.length === 1 &&
              path.node.arguments[0].type === 'StringLiteral' &&
              path.node.arguments[0].value === '@stripe/stripe-terminal-react-native/package.json'
            ) {
              path.replaceWithSourceString(`(${readPackageJson()})`);
            }
          }
        },
      };
    },
  ],
};
