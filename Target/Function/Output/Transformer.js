var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var Transformer_default = /* @__PURE__ */ __name((...[Context]) => (Node) => ts.visitNode(Node, Visit(Context)), "default");
const { default: ts } = await import("typescript");
const { default: Visit } = await import("../Output/Transformer/Visit.js");
export {
  Visit,
  Transformer_default as default,
  ts
};
//# sourceMappingURL=Transformer.js.map
