var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class Transformer {
  static {
    __name(this, "Transformer");
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
