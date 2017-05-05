import assert from 'assert';
import Plugin from './Plugin';

export default function({ types }) {
  let plugins = null;

  // Only for test
  global.__clearBabelAntdPlugin = () => {
    plugins = null;
  };

  function applyInstance(method, args, context) {
    for (const plugin of plugins) {
      if (plugin[method]) {
        plugin[method].apply(plugin, [...args, context]);
      }
    }
  }

  function Program(path, { opts }) {
    // Init plugin instances once.
    if (!plugins) {
      if (Array.isArray(opts)) {
        plugins = opts.map(
          ({ libraryName, libraryDirectory, moduleResolver }) => {
            assert(libraryName, 'libraryName should be provided');
            return new Plugin(
              libraryName,
              libraryDirectory,
              moduleResolver,
              types
            );
          }
        );
      } else {
        opts = opts || {};
        assert(opts.libraryName, 'libraryName should be provided');
        plugins = [
          new Plugin(
            opts.libraryName,
            opts.libraryDirectory,
            opts.moduleResolver,
            types
          )
        ];
      }
    }
    applyInstance('Program', arguments, this);
  }

  const methods = [
    'ImportDeclaration',
    'CallExpression',
    'MemberExpression',
    'Property',
    'VariableDeclarator',
    'LogicalExpression',
    'ConditionalExpression',
    'IfStatement',
    'ExpressionStatement',
    'ExportDefaultDeclaration'
  ];

  const ret = {
    visitor: { Program }
  };

  for (const method of methods) {
    ret.visitor[method] = function() {
      applyInstance(method, arguments, ret.visitor);
    };
  }

  return ret;
}
