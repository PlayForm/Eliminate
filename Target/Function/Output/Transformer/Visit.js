var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class Track {
  static {
    __name(this, "Track");
  }
  Count = /* @__PURE__ */ new Map();
  Variable(Name, Node) {
    const Result = Get(Name, "Name", this.Count);
    if (Result) {
      this.Count.get(Result)?.Usage.add({
        Node,
        Position: Node.pos
      });
    }
  }
  Initializer(Variable, Initializer) {
    if (!this.Count.has(Initializer)) {
      this.Count.set(Initializer, {
        Name: Variable,
        Usage: /* @__PURE__ */ new Set()
      });
    }
  }
  Scope(Node) {
    ts.forEachChild(Node, (Node2) => this.Scope(Node2));
    if (!Node) {
      return;
    }
    if (ts.isIdentifier(Node)) {
      if (Node.parent && ts.isBinaryExpression(Node.parent) && Node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && Node.parent.left === Node) {
        const Result = Get(Node.text, "Name", this.Count);
        if (Result) {
          this.Count.delete(Result);
        }
      }
      if (!Node.parent || !ts.isVariableDeclaration(Node.parent)) {
        this.Variable(Node.text, Node);
      }
    } else if (ts.isVariableStatement(Node)) {
      Node.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          if (!(Node.modifiers?.some(
            (m) => m.kind === ts.SyntaxKind.ExportKeyword
          ) ?? false)) {
            this.Initializer(decl.name.text, decl.initializer);
          }
        }
      });
    }
  }
  Inline(Name, _Node) {
    try {
      const Result = Get(Name, "Name", this.Count);
      if (!Result) {
        return false;
      }
      const Initializer = this.Count.get(Result);
      if (!Initializer) {
        return false;
      }
      if (_Node) {
        while (_Node && !ts.isFunctionDeclaration(_Node) && !ts.isMethodDeclaration(_Node) && !ts.isSourceFile(_Node)) {
          _Node = _Node.parent;
        }
        const _UsageNode = Array.from(Initializer.Usage).every(
          ({ Node }) => {
            while (Node && !ts.isFunctionDeclaration(Node) && !ts.isMethodDeclaration(Node) && !ts.isSourceFile(Node)) {
              Node = Node.parent;
            }
            return Node === _Node;
          }
        );
        if (!_UsageNode) {
          return false;
        }
      }
      if (ts.isArrayLiteralExpression(Result) || // ts.isAwaitExpression(Result) ||
      // ts.isMethodDeclaration(Result) ||
      // ts.isFunctionDeclaration(Result) ||
      ts.isBinaryExpression(Result) || // ts.isCallExpression(Result) ||
      ts.isNewExpression(Result)) {
        return false;
      }
      const Count = Initializer.Usage.size;
      return Count === 1 || ts.isIdentifier(Result) || // Include conditional expressions as valid nodes for inlining
      ts.isConditionalExpression(Result) || ts.isLiteralExpression(Result) && Count <= 3;
    } catch (error) {
      console.log(error);
    }
    return false;
  }
}
class Transformer {
  static {
    __name(this, "Transformer");
  }
  Context;
  Tracker;
  constructor(Context) {
    this.Context = Context;
    this.Tracker = new Track();
  }
  Variable(Node) {
    const Processed = Node.declarationList.declarations.map((Node2) => {
      if (Node2.initializer && ts.isIdentifier(Node2.initializer)) {
        const Resolved = this.Resolve(Node2.initializer.text, Node2);
        if (Resolved) {
          return ts.factory.updateVariableDeclaration(
            Node2,
            Node2.name,
            Node2.exclamationToken,
            Node2.type,
            Resolved
          );
        }
      }
      return Node2;
    });
    const Remaining = Processed.filter((Variable) => {
      if (ts.isIdentifier(Variable.name)) {
        return !this.Tracker.Inline(Variable.name.text, Variable);
      }
      return true;
    });
    if (Remaining.length === 0) {
      return void 0;
    }
    return ts.factory.createVariableStatement(
      Node.modifiers,
      ts.factory.createVariableDeclarationList(
        Remaining,
        Node.declarationList.flags
      )
    );
  }
  Identifier(Node) {
    const Name = Node.text;
    if (!Node.parent) {
      return Node;
    }
    if (
      // Parameter in function/method declaration
      ts.isParameter(Node.parent) || // Property access (e.g., obj.prop)
      ts.isPropertyAccessExpression(Node.parent) && Node.parent.name === Node || // Variable declaration
      ts.isVariableDeclaration(Node.parent) || // Binding patterns
      ts.isBindingElement(Node.parent) || // Class member
      ts.isMethodDeclaration(Node.parent) || ts.isPropertyDeclaration(Node.parent) || ts.isConstructorDeclaration(Node.parent) || // Import/Export statements
      ts.isImportSpecifier(Node.parent) || ts.isExportSpecifier(Node.parent) || // Object literal property names
      ts.isPropertyAssignment(Node.parent) && Node.parent.name === Node || // Method parameters
      ts.isMethodSignature(Node.parent) || // Type annotations
      ts.isTypeReferenceNode(Node.parent) || // Class/Interface declarations
      ts.isClassDeclaration(Node.parent) || ts.isInterfaceDeclaration(Node.parent)
    ) {
      return Node;
    }
    return this.Resolve(Name, Node) || Node;
  }
  Resolve(Name, Node) {
    if (!this.Tracker.Inline(Name, Node)) {
      return void 0;
    }
    const Result = Get(Name, "Name", this.Tracker.Count);
    if (!Result) {
      return void 0;
    }
    if (ts.isShorthandPropertyAssignment(Result.parent)) {
      return Result;
    }
    if (ts.isIdentifier(Result)) {
      return this.Resolve(Result.text, Node) || Result;
    }
    return Result;
  }
  Look(Node) {
    let Result;
    switch (true) {
      case ts.isVariableStatement(Node):
        Result = this.Variable(Node);
        break;
      case ts.isIdentifier(Node):
        Result = this.Identifier(Node);
        break;
      case ts.isShorthandPropertyAssignment(Node):
        const Name = Node.name.text;
        const Resolved = this.Resolve(Name, Node);
        if (Resolved) {
          Result = ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(Name),
            ts.isConditionalExpression(Resolved) ? ts.factory.createParenthesizedExpression(Resolved) : Resolved
          );
        } else {
          Result = Node;
        }
        break;
      // Class-related nodes
      case ts.isPropertyDeclaration(Node):
      case ts.isMethodDeclaration(Node):
      case ts.isConstructorDeclaration(Node):
      case ts.isGetAccessor(Node):
      case ts.isSetAccessor(Node):
      case ts.isClassExpression(Node):
      // Function-related nodes
      case ts.isFunctionDeclaration(Node):
      case ts.isFunctionExpression(Node):
      case ts.isArrowFunction(Node):
      case ts.isCallExpression(Node):
      case ts.isNewExpression(Node):
      // Complex expressions
      case ts.isAwaitExpression(Node):
      case ts.isYieldExpression(Node):
      case ts.isSpreadElement(Node):
      case ts.isTemplateLiteral(Node):
      case ts.isTaggedTemplateExpression(Node):
      case ts.isJsxElement(Node):
      case ts.isJsxFragment(Node):
      // Object and property nodes
      case ts.isObjectLiteralExpression(Node):
      case ts.isPropertyAccessExpression(Node):
      case ts.isElementAccessExpression(Node):
      // Control flow nodes
      case ts.isIfStatement(Node):
      case ts.isSwitchStatement(Node):
      case ts.isForStatement(Node):
      case ts.isWhileStatement(Node):
      case ts.isDoStatement(Node):
      case ts.isTryStatement(Node):
        Result = Node;
        break;
      default:
        Result = Node;
    }
    return ts.visitEachChild(
      Result,
      (Node2) => this.Look(Node2),
      this.Context
    );
  }
  Visit(_Node, Collection = 0) {
    const Failed = 10;
    if (Collection >= Failed) {
      return _Node;
    }
    this.Tracker = new Track();
    this.Tracker.Scope(_Node);
    let Node = _Node;
    try {
      Node = this.Look(_Node) ?? _Node;
    } catch (_Error) {
      console.log("-------------------------");
      console.log("Could not transform Node:");
      console.log(_Node.getText());
      console.log("--------------");
      console.log("Errored with:");
      console.log(_Error);
    }
    if (Node && Node !== _Node) {
      return this.Visit(Node, Collection + 1);
    }
    return _Node;
  }
}
const {
  default: ts,
  isIdentifier,
  factory
} = await import("typescript");
var Visit_default = /* @__PURE__ */ __name((context) => (rootNode) => new Transformer(context).Visit(rootNode), "default");
const { default: Get } = await import("../../Output/Transformer/Visit/Get.js");
export {
  Get,
  Visit_default as default,
  factory,
  isIdentifier,
  ts
};
//# sourceMappingURL=Visit.js.map
