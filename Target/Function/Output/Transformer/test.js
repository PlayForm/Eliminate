var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class Track {
  static {
    __name(this, "Track");
  }
  Count = /* @__PURE__ */ new Map();
  Scope(Node) {
    ts.forEachChild(Node, (Node2) => this.Scope(Node2));
    if (ts.isIdentifier(Node)) {
      if (!ts.isVariableDeclaration(Node.parent)) {
        this.Variable(Node.text, Node);
      }
    } else if (ts.isVariableStatement(Node)) {
      Node.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          this.Initializer(decl.name.text, decl.initializer);
        }
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
  Variable(Name, Node) {
    const Result = Get(Name, "Name", this.Count);
    if (Result) {
      this.Count.get(Result)?.Usage.add({
        Node,
        Position: Node.pos
      });
    }
  }
  shouldInline(Name) {
    const Result = Get(Name, "Name", this.Count);
    if (!Result) {
      return false;
    }
    const Initializer = this.Count.get(Result);
    if (!Initializer) {
      return false;
    }
    const isSimpleValue = ts.isIdentifier(Result) || ts.isLiteralExpression(Result);
    const useCount = Initializer.Usage.size;
    return useCount === 1 || isSimpleValue && useCount <= 3;
  }
  getInitializer(Name) {
    const Result = Get(Name, "Name", this.Count);
    return Result;
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
    const Processed = Node.declarationList.declarations.map((decl) => {
      if (decl.initializer && ts.isIdentifier(decl.initializer)) {
        const Resolved = this.resolveChain(decl.initializer.text);
        if (Resolved) {
          return ts.factory.updateVariableDeclaration(
            decl,
            decl.name,
            decl.exclamationToken,
            decl.type,
            Resolved
          );
        }
      }
      return decl;
    });
    const Remaining = Processed.filter((decl) => {
      if (ts.isIdentifier(decl.name)) {
        return !this.Tracker.shouldInline(decl.name.text);
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
    if (ts.isPropertyAccessExpression(Node.parent) && Node.parent.name === Node || ts.isVariableDeclaration(Node.parent) || ts.isBindingElement(Node.parent)) {
      return Node;
    }
    const resolved = this.resolveChain(Name);
    return resolved || Node;
  }
  resolveChain(Name) {
    if (!this.Tracker.shouldInline(Name)) {
      return void 0;
    }
    const initializer = this.Tracker.getInitializer(Name);
    if (!initializer) {
      return void 0;
    }
    if (ts.isIdentifier(initializer)) {
      return this.resolveChain(initializer.text) || initializer;
    }
    return initializer;
  }
  Look(Node) {
    if (ts.isVariableStatement(Node)) {
      const result = this.Variable(Node);
      return result || ts.factory.createEmptyStatement();
    }
    if (ts.isIdentifier(Node)) {
      return this.Identifier(Node);
    }
    return ts.visitEachChild(
      Node,
      (child) => this.Look(child),
      this.Context
    );
  }
  Visit(Node, Collection = 0) {
    if (Collection >= 10) {
      return Node;
    }
    this.Tracker.Scope(Node);
    let TransformedNode = this.Look(Node);
    if (TransformedNode !== Node) {
      return this.Visit(TransformedNode, Collection + 1);
    }
    return TransformedNode;
  }
}
const {
  default: ts,
  isIdentifier,
  factory
} = await import("typescript");
var test_default = /* @__PURE__ */ __name((context) => (rootNode) => new Transformer(context).Visit(rootNode), "default");
const { default: Get } = await import("../../Output/Transformer/Visit/Get.js");
export {
  Get,
  test_default as default,
  factory,
  isIdentifier,
  ts
};
//# sourceMappingURL=test.js.map
