export const On = process.env["NODE_ENV"] === "development";
/**
 * @module ESBuild
 *
 */
export default {
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
    drop: On ? [] : ["console", "debugger"],
    ignoreAnnotations: !On,
    keepNames: On,
    plugins: [
        ...[
            !On
                ? {
                    name: "Target",
                    setup({ onStart, initialOptions: { outdir } }) {
                        onStart(async () => {
                            try {
                                outdir
                                    ? await (await import("fs/promises")).rm(outdir, {
                                        recursive: true,
                                    })
                                    : {};
                            }
                            catch (_Error) {
                                console.log(_Error);
                            }
                        });
                    },
                }
                : null,
            !On
                ? {
                    name: "Example",
                    setup({ onEnd }) {
                        onEnd(async () => {
                            await Exec("node ./Target/Class/Eliminate.js Configuration.ts");
                        });
                    },
                }
                : null,
        ].filter(Boolean),
    ],
    define: {
        "process.env.VERSION_PACKAGE": `'${(await (await import("@playform/build/Target/Function/JSON.js")).default("package.json"))?.version}'`,
    },
};
// @ts-expect-error
export const { default: Exec } = await import("@playform/build/Target/Function/Exec.js");
