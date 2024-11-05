var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var File_default = /* @__PURE__ */ __name(async (...[Path]) => {
  if (Path.split(".").pop() === "ts") {
    const projectRoot = (await import("path")).resolve(
      (await import("path")).dirname(
        (await import("url")).fileURLToPath(import.meta.url)
      ),
      "../.."
    );
    await (await import("fs/promises")).writeFile(
      Path.replace(".ts", ".js"),
      (await import("typescript")).transpile(
        (await (await import("fs/promises")).readFile(Path, "utf-8")).toString(),
        (await import("typescript")).parseJsonConfigFileContent(
          (await import("typescript")).readConfigFile(
            (await import("path")).join(
              projectRoot,
              "tsconfig.json"
            ),
            (await import("typescript")).sys.readFile
          ).config,
          (await import("typescript")).sys,
          projectRoot
        ).options
      )
    );
  }
  return (await import((await import("url")).pathToFileURL(Path).toString().replace(".ts", ".js"))).default;
}, "default");
export {
  File_default as default
};
//# sourceMappingURL=File.js.map
