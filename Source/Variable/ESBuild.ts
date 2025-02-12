import type { BuildOptions, Plugin } from "esbuild";

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
	drop: On ? [] : ["debugger"],
	ignoreAnnotations: !On,
	keepNames: On,
	plugins: [
		...([
			On
				? null
				: ({
						name: "Target",
						setup({ onStart, initialOptions: { outdir } }): void {
							onStart(async () => {
								try {
									outdir
										? await (
												await import("node:fs/promises")
											).rm(outdir, {
												recursive: true,
											})
										: {};
								} catch (_Error) {
									// biome-ignore lint/suspicious/noConsole:
									console.log(_Error);
								}
							});
						},
					} as Plugin),
			On
				? null
				: ({
						name: "Test",
						setup({ onEnd, onLoad }): void {
							// biome-ignore lint/performance/useTopLevelRegex:
							onLoad({ filter: /.*/ }, async ({ path }) => {
								path = path.split(sep).join(posix.sep);

								if (
									path.includes("Source/Test/Input/") ||
									path.includes("Source/Test/Output/")
								) {
									return {
										loader: "copy",
										contents: await (
											await import("node:fs/promises")
										).readFile(path),
									};
								}

								return null;
							});

							onEnd(
								async () =>
									await Exec(
										"mocha --timeout 60000 --colors --file Target/Test/Output.js",
									),
							);
						},
					} as Plugin),
			// !On
			// 	? ({
			// 			name: "Example",
			// 			setup({ onEnd }) {
			// 				onEnd(async () => {
			// 					await Exec(
			// 						"node ./Target/Class/Eliminate.js Configuration.ts",
			// 					);
			// 				});
			// 			},
			// 		} as Plugin)
			// 	: null,
		].filter(Boolean) as Plugin[]),
	],
	define: {
		"process.env.VERSION_PACKAGE": `'${
			(
				await (
					await import("@playform/build/Target/Function/JSON.js")
				).default("package.json")
			)?.version
		}'`,
	},
} satisfies BuildOptions as BuildOptions;

export const { default: Exec } = await import(
	"@playform/build/Target/Function/Exec.js"
);

export const { sep, posix } = await import("node:path");
