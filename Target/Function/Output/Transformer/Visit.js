var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class Track {
  static {
    __name(this, "Track");
  }
  Count = /* @__PURE__ */ new Map();
  Variable(Name, Node) {
    const Result = Get(Name, "Name", this.Count)?.[0];
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
        const Result = Get(Node.text, "Name", this.Count)?.[0];
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
      const Result = Get(Name, "Name", this.Count)?.[0];
      if (!Result) {
        return false;
      }
      const Initializer = this.Count.get(Result);
      if (!Initializer) {
        return false;
      }
      Log(Initializer.Name);
      Log(Initializer.Usage);
      const Count = Initializer.Usage.size;
      return Count === 1 || ts.isIdentifier(Result) || ts.isConditionalExpression(Result) || ts.isLiteralExpression(Result);
    } catch (error) {
      Log(error);
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
      // Parameter and function-related checks
      ts.isParameter(Node.parent) || ts.isMethodDeclaration(Node.parent) || ts.isConstructorDeclaration(Node.parent) || ts.isFunctionDeclaration(Node.parent) || // Property and class-related checks
      ts.isPropertyDeclaration(Node.parent) || ts.isPropertyAccessExpression(Node.parent) && Node.parent.name === Node || ts.isPropertyAssignment(Node.parent) && Node.parent.name === Node || // Variable and binding checks
      ts.isVariableDeclaration(Node.parent) || ts.isBindingElement(Node.parent) || // Import/Export checks
      ts.isImportSpecifier(Node.parent) || ts.isExportSpecifier(Node.parent) || // Type-related checks
      ts.isTypeReferenceNode(Node.parent) || ts.isTypeLiteralNode(Node.parent) || ts.isTypeAliasDeclaration(Node.parent) || ts.isTypeParameterDeclaration(Node.parent) || ts.isIndexSignatureDeclaration(Node.parent) || ts.isPropertySignature(Node.parent) || ts.isTypePredicateNode(Node.parent) || ts.isPartOfTypeNode(Node.parent) || ts.isInterfaceDeclaration(Node.parent) || ts.isMethodSignature(Node.parent) || // Check if part of type annotations
      ts.isMethodDeclaration(Node.parent) || ts.isParameter(Node.parent) || ts.isPropertyDeclaration(Node.parent) || // Class/Interface declarations
      ts.isClassDeclaration(Node.parent)
    ) {
      return Node;
    }
    return this.Resolve(Name, Node) || Node;
  }
  Resolve(Name, Node) {
    if (!this.Tracker.Inline(Name, Node)) {
      return void 0;
    }
    const Result = Get(Name, "Name", this.Tracker.Count)?.[0];
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
      Log("-------------------------");
      Log("Could not transform Node:");
      Log(_Node.getText());
      Log("--------------");
      Log("Errored with:");
      Log(_Error);
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
const { default: Log } = await import("../../Output/Transformer/Visit/Log.js");
export {
  Get,
  Log,
  Visit_default as default,
  factory,
  isIdentifier,
  ts
};
//# sourceMappingURL=Visit.js.map
