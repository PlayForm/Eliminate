var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import * as ts from "typescript";
var Inline_default = /* @__PURE__ */ __name(async (Source, Option = {}) => {
  const Host = ts.createCompilerHost({});
  const File = "Input.ts";
  Host.getSourceFile = (Name, Version) => {
    if (Name === File) {
      return ts.createSourceFile(Name, Source, Version);
    }
    return void 0;
  };
  Host.writeFile = () => {
  };
  const Program = ts.createProgram(
    [File],
    {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS
    },
    Host
  );
  const Diagnostic = Program.getSyntacticDiagnostics();
  if (Diagnostic.length > 0) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(Diagnostic, {
        getCanonicalFileName: /* @__PURE__ */ __name((Name) => Name, "getCanonicalFileName"),
        getCurrentDirectory: process.cwd,
        getNewLine: /* @__PURE__ */ __name(() => "\n", "getNewLine")
      })
    );
  }
  return ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: !Option.Comment
  }).printFile(
    ts.transform(Program.getSourceFile(File), [
      new (await import("../Class/Eliminate/Output.js")).default(
        Option
      ).Transform(Program)
    ]).transformed[0]
  );
}, "default");
export {
  Inline_default as default
};
//# sourceMappingURL=Inline.js.map
