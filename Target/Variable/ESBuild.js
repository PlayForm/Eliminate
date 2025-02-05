const On = process.env["NODE_ENV"] === "development";
var ESBuild_default = {
  color: true,
  format: "esm",
  logLevel: "error",
  metafile: true,
  minify: !On,
  outdir: "Target",
  platform: "node",
  target: "esnext",
  tsconfig: "tsconfig.json",
  write: true,
  bundle: false,
  sourcemap: On,
  drop: On ? [] : ["debugger"],
  ignoreAnnotations: !On,
  keepNames: On,
  plugins: [
    ...[
      !On ? {
        name: "Target",
        setup({ onStart, initialOptions: { outdir } }) {
          onStart(async () => {
            try {
              outdir ? await (await import("fs/promises")).rm(outdir, {
                recursive: true
              }) : {};
            } catch (_Error) {
              console.log(_Error);
            }
          });
        }
      } : null,
      {
        name: "Test",
        setup({ onEnd, onLoad }) {
          onLoad({ filter: /.*/ }, async ({ path }) => {
            path = path.split(sep).join(posix.sep);
            if (path.includes("Source/Test/Input") || path.includes("Source/Test/Output")) {
              return {
                loader: "copy",
                contents: await (await import("fs/promises")).readFile(path)
              };
            }
            return null;
          });
          onEnd(
            async () => await Exec(
              "mocha --timeout 60000 --colors --file Target/Test/Inline.js"
            )
          );
        }
      }
    ].filter(Boolean)
  ],
  define: {
    "process.env.VERSION_PACKAGE": `'${(await (await import("@playform/build/Target/Function/JSON.js")).default("package.json"))?.version}'`
  }
};
const { default: Exec } = await import("@playform/build/Target/Function/Exec.js");
const { sep, posix } = await import("path");
export {
  Exec,
  On,
  ESBuild_default as default,
  posix,
  sep
};
//# sourceMappingURL=ESBuild.js.map
