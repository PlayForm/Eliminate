var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var Eliminate_default = /* @__PURE__ */ __name(async (...[Eliminate]) => {
  let Configuration = Merge(
    (await import("../Variable/Eliminate.js")).default,
    {}
  );
  Configuration = Eliminate ? Merge(
    Configuration,
    await (await import("../Function/File.js")).default(Eliminate)
  ) : Configuration;
  const { Path, File, Action } = Configuration;
  const Paths = /* @__PURE__ */ new Set();
  if (typeof Path !== "undefined") {
    if (Array.isArray(Path) || Path instanceof Set) {
      Path.forEach((Path2) => Paths.add(Path2));
    }
    if (Path instanceof Map) {
      Paths.add(Path);
    }
  }
  for (const Path2 of Paths) {
    if (typeof File !== "undefined" && typeof File !== "boolean" && typeof Action !== "boolean") {
      await (await (await (await new (await import("@playform/pipe")).default(
        Configuration.Cache,
        Configuration.Logger
      ).In(Path2)).By(File)).Not(Configuration.Exclude)).Pipe(Action);
    }
  }
}, "default");
const { default: Merge } = await import("../Function/Merge.js");
const Pipe = [];
export {
  Merge,
  Pipe,
  Eliminate_default as default
};
//# sourceMappingURL=Eliminate.js.map
