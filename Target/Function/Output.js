var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var Output_default = /* @__PURE__ */ __name(async (...[Source]) => ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  omitTrailingSemicolon: false,
  noEmitHelpers: false
}).printFile(
  ts.transform(
    ts.createSourceFile(
      "temp.ts",
      Source,
      ts.ScriptTarget.Latest,
      true
    ),
    [(await import("./Output/Transformer.js")).default]
  ).transformed[0]
), "default");
const ts = await import("typescript");
export {
  Output_default as default,
  ts
};
//# sourceMappingURL=Output.js.map
