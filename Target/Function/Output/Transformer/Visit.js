var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
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
    this.Tracker.Status.clear();
    const Result = ts.visitEachChild(
      Node,
      (Node2) => this.Look(Node2),
      this.Context
    );
    const Remaining = Result.declarationList.declarations.filter((decl) => {
      if (ts.isIdentifier(decl.name)) {
        const shouldInline = this.Tracker.Inline(decl.name.text);
        if (shouldInline) {
          this.Tracker.Status.add(decl);
        }
        return !shouldInline;
      }
      return true;
    });
    if (Remaining.length === 0) {
      return ts.factory.createEmptyStatement();
    }
    if (Remaining.length !== Result.declarationList.declarations.length) {
      const New = ts.factory.createVariableStatement(
        Result.modifiers,
        ts.factory.createVariableDeclarationList(
          Remaining,
          Result.declarationList.flags
        )
      );
      this.Tracker.Scope(New);
      return New;
    }
    return Result;
  }
  Identifier(Node) {
    const Result = ts.visitEachChild(
      Node,
      (Node2) => this.Look(Node2),
      this.Context
    );
    const name = Result.text;
    if (ts.isPropertyAccessExpression(Result.parent) && Result.parent.name === Result || ts.isVariableDeclaration(Result.parent) || ts.isBindingElement(Result.parent)) {
      return Result;
    }
    if (this.Tracker.Inline(name)) {
      const Inlined = Get(name, "Name", this.Tracker.Count);
      if (Inlined) {
        return ts.visitNode(
          Inlined,
          (node) => ts.isExpression(node) ? node : ts.factory.createIdentifier(name)
        );
      }
    }
    return Result;
  }
  Look(Node) {
    switch (true) {
      case ts.isVariableStatement(Node):
        return this.Variable(Node);
      case ts.isIdentifier(Node):
        return this.Identifier(Node);
      default:
        return ts.visitEachChild(
          Node,
          (Node2) => this.Look(Node2),
          this.Context
        );
    }
  }
  Visit(_Node, Collection = 0) {
    const Failed = 10;
    if (Collection >= Failed) {
      return _Node;
    }
    this.Tracker.Status.clear();
    this.Tracker.Scope(_Node);
    let Node = ts.visitNode(_Node, (Node2) => this.Look(Node2));
    if (Node !== _Node) {
      return this.Visit(Node, Collection + 1);
    }
    return Node;
  }
}
class Track {
  static {
    __name(this, "Track");
  }
  Count = /* @__PURE__ */ new Map();
  Status = /* @__PURE__ */ new Set();
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
    console.log(`--------------------------${"-".repeat(Variable.length)}`);
    console.log(`Tracking initializer for: ${Variable}`);
    if (!this.Count.has(Initializer)) {
      this.Count.set(Initializer, {
        Name: Variable,
        Usage: /* @__PURE__ */ new Set()
      });
    }
  }
  Variable(Name, Node) {
    console.log(`----------------${"-".repeat(Name.length)}`);
    console.log(`Tracking use of ${Name}`);
    const Result = Get(Name, "Name", this.Count);
    if (Result) {
      this.Count.get(Result)?.Usage.add({
        Node,
        Position: Node.pos
      });
    }
  }
  Inline(Name) {
    const Result = Get(Name, "Name", this.Count);
    if (!Result) {
      return false;
    }
    const Initializer = this.Count.get(Result);
    if (!Initializer) {
      return false;
    }
    const isSimpleIdentifier = ts.isIdentifier(Result);
    const useCount = Initializer.Usage.size;
    if (useCount === 1 || isSimpleIdentifier && useCount <= 3) {
      return true;
    }
    return false;
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
