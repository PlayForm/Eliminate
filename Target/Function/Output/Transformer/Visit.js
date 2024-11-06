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
    if (useCount === 3 || isSimpleIdentifier && useCount <= 3) {
      return true;
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
    const Processed = Node.declarationList.declarations.map((decl) => {
      if (decl.initializer && ts.isIdentifier(decl.initializer)) {
        const Resolved = this.Resolve(decl.initializer.text);
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
        return !this.Tracker.Inline(decl.name.text);
      }
      return true;
    });
    if (Remaining.length === 0) {
      return ts.factory.createEmptyStatement();
    }
    if (Remaining.length !== Node.declarationList.declarations.length) {
      return ts.factory.createVariableStatement(
        Node.modifiers,
        ts.factory.createVariableDeclarationList(
          Remaining,
          Node.declarationList.flags
        )
      );
    }
    return Node;
  }
  Identifier(Node) {
    const Name = Node.text;
    if (ts.isPropertyAccessExpression(Node.parent) && Node.parent.name === Node || ts.isVariableDeclaration(Node.parent) || ts.isBindingElement(Node.parent)) {
      return Node;
    }
    const resolvedInitializer = this.Resolve(Name);
    if (resolvedInitializer) {
      return resolvedInitializer;
    }
    return Node;
  }
  Resolve(Name) {
    if (this.Tracker.Inline(Name)) {
      const Result = Get(Name, "Name", this.Tracker.Count);
      if (Result && ts.isIdentifier(Result)) {
        return this.Resolve(Result.text) ?? Result;
      }
      return Result;
    }
    return void 0;
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
    console.log(
      `-----------------------${"-".repeat(Collection.toString().length)}`
    );
    console.log(`Visiting for the ${Collection} time.`);
    const Failed = 10;
    if (Collection >= Failed) {
      return _Node;
    }
    this.Tracker.Scope(_Node);
    let Node = this.Look(_Node);
    if (Node !== _Node) {
      return this.Visit(Node, Collection + 1);
    }
    return Node;
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
