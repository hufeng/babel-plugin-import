import { join } from 'path';

/**
 * moduleResolver: {moduleName: {path: '', type: 'default|*|export'}}
 */

// Examples of "full" imports:
//      import * as name from 'module'; (ImportNamespaceSpecifier)
//      import name from 'module'; (ImportDefaultSpecifier)

// transform this:
//      import Bootstrap, { Grid } from 'react-bootstrap';
// into this:
//      import Bootstrap from 'react-bootstrap';
//transforms.push(types.importDeclaration(fullImports, types.stringLiteral(source)));

// Examples of member imports:
//      import { member } from 'module'; (ImportSpecifier)
//      import { member as alias } from 'module' (ImportSpecifier)

// transform this:
//      import { Grid as gird } from 'react-bootstrap';
// into this:
//      import gird from 'react-bootstrap/lib/Grid';
export default class Plugin {
  constructor(libraryName, libraryDirectory, moduleResolver, types) {
    this.specified = null;
    this.libraryObjs = null;
    this.selectedMethods = null;
    this.libraryName = libraryName;
    this.libraryDirectory = typeof libraryDirectory === 'undefined'
      ? 'lib'
      : libraryDirectory;
    this.moduleResolver = moduleResolver;
    this.types = types;
  }

  importMethod(methodName, file, opts) {
    if (!this.selectedMethods[methodName]) {
      const libraryDirectory = this.libraryDirectory;
      const style = this.style;

      //获取当前模块名的Resolver信息
      const resolver = this.moduleResolver[methodName];
      if (!resolver) {
        throw new Error(
          `Could not find ${methodName} resolver data in .babelrc`
        );
      }

      //当前模块映射的路径
      const modulePath = resolver.path;
      if (!modulePath) {
        throw new Error(
          `Could not find ${methodName} resolver path field in .babelrc`
        );
      }

      //default|*|export
      const moduleType = resolver.type;
      if (!moduleType) {
        throw new Error(`please specify ${methodName}'s resolver type.`);
      }

      const transformedMethodName = modulePath;
      const path = winPath(
        join(this.libraryName, libraryDirectory, transformedMethodName)
      );

      this.selectedMethods[methodName] = null;

      /**
       * import {A, B, test} from 'uikit'
       *
       * transform =>
       *
       * 转换函数：specifiers.push(t.importNamespaceSpecifier(id));
       *  import A from 'uikit/a' //type default
       *  module a: export default
       *
       *  转换函数：specifiers.push(t.importDefaultSpecifier(id));
       *  import * as B from 'uikit/b' //type *
       *  module b => export a .. export b ... export c...
       *
       * specifiers.push(t.importSpecifier(id, t.identifier(imported)));
       *  import {test} from 'uikit/test'
       *   module test => export test ...
       */
      if (moduleType === 'default') {
        this.selectedMethods[methodName] = file.addImport(path, 'default');
      } else if (moduleType === '*') {
        this.selectedMethods[methodName] = file.addImport(path, '*');
      } else {
        this.selectedMethods[methodName] = file.addImport(path, methodName);
      }
    }

    return this.selectedMethods[methodName];
  }

  buildExpressionHandler(node, props, path, opts) {
    const { file } = path.hub;
    const types = this.types;
    props.forEach(prop => {
      if (!types.isIdentifier(node[prop])) return;
      if (this.specified[node[prop].name]) {
        node[prop] = this.importMethod(node[prop].name, file, opts);
      }
    });
  }

  buildDeclaratorHandler(node, prop, path, opts) {
    const { file } = path.hub;
    const types = this.types;
    if (!types.isIdentifier(node[prop])) return;
    if (this.specified[node[prop].name]) {
      node[prop] = this.importMethod(node[prop].name, file, opts);
    }
  }

  Program() {
    this.specified = Object.create(null);
    this.libraryObjs = Object.create(null);
    this.selectedMethods = Object.create(null);
  }

  ImportDeclaration(path, { opts }) {
    const { node } = path;

    // path maybe removed by prev instances.
    if (!node) return;

    const { value } = node.source;
    const libraryName = this.libraryName;
    const types = this.types;
    if (value === libraryName) {
      node.specifiers.forEach(spec => {
        if (types.isImportSpecifier(spec)) {
          this.specified[spec.local.name] = spec.imported.name;
        } else {
          this.libraryObjs[spec.local.name] = true;
        }
      });
      path.remove();
    }
  }

  CallExpression(path, { opts }) {
    const { node } = path;
    const { file } = path.hub;
    const { name, object, property } = node.callee;
    const types = this.types;

    if (types.isIdentifier(node.callee)) {
      if (this.specified[name]) {
        node.callee = this.importMethod(this.specified[name], file, opts);
      }
    }

    node.arguments = node.arguments.map(arg => {
      const { name: argName } = arg;
      if (
        this.specified[argName] &&
        path.scope.hasBinding(argName) &&
        path.scope.getBinding(argName).path.type === 'ImportSpecifier'
      ) {
        return this.importMethod(this.specified[argName], file, opts);
      }
      return arg;
    });
  }

  MemberExpression(path, { opts }) {
    const { node } = path;
    const { file } = path.hub;

    // multiple instance check.
    if (!node.object || !node.object.name) return;

    if (this.libraryObjs[node.object.name]) {
      // antd.Button -> _Button
      path.replaceWith(this.importMethod(node.property.name, file, opts));
    } else if (this.specified[node.object.name]) {
      node.object = this.importMethod(
        this.specified[node.object.name],
        file,
        opts
      );
    }
  }

  Property(path, { opts }) {
    const { node } = path;
    this.buildDeclaratorHandler(node, 'value', path, opts);
  }

  VariableDeclarator(path, { opts }) {
    const { node } = path;
    this.buildDeclaratorHandler(node, 'init', path, opts);
  }

  LogicalExpression(path, { opts }) {
    const { node } = path;
    this.buildExpressionHandler(node, ['left', 'right'], path, opts);
  }

  ConditionalExpression(path, { opts }) {
    const { node } = path;
    this.buildExpressionHandler(
      node,
      ['test', 'consequent', 'alternate'],
      path,
      opts
    );
  }

  IfStatement(path, { opts }) {
    const { node } = path;
    this.buildExpressionHandler(node, ['test'], path, opts);
    this.buildExpressionHandler(node.test, ['left', 'right'], path, opts);
  }

  ExpressionStatement(path, { opts }) {
    const { node } = path;
    const { types } = this;
    if (types.isAssignmentExpression(node.expression)) {
      this.buildExpressionHandler(node.expression, ['right'], path, opts);
    }
  }

  ExportDefaultDeclaration(path, { opts }) {
    const { node } = path;
    this.buildExpressionHandler(node, ['declaration'], path, opts);
  }
}

function winPath(path) {
  return path.replace(/\\/g, '/');
}
