import type { BuildOptions, Plugin } from "esbuild";

export const On = process.env["NODE_ENV"] === "development";

/**
 * @module ESBuild
 *
 */
export default {
	color: true,
	format: "esm",
	logLevel: "debug",
	metafile: true,
	minify: true,
	outdir: "Target",
	platform: "node",
	target: "esnext",
	tsconfig: "tsconfig.json",
	write: true,
	plugins: [
		...([
			!On
				? {
						name: "Target",
						setup({ onStart, initialOptions: { outdir } }) {
							onStart(async () => {
								try {
									outdir
										? await (
												await import("fs/promises")
											).rm(outdir, {
												recursive: true,
											})
										: {};
								} catch (_Error) {
									console.log(_Error);
								}
							});
						},
					}
				: null,
			On
				? ({
						name: "Example",
						setup({
							onEnd,
							onStart,
							initialOptions: { entryPoints },
						}) {
							// onStart(() => {
							// 	if (
							// 		Array.isArray(entryPoints) &&
							// 		entryPoints instanceof Array
							// 	) {
							// 		entryPoints?.push(
							// 			"Example/Input/Predefined.ts",
							// 		);
							// 	}
							// });

							onEnd(async () => {
								await Exec("Eliminate Configuration.ts");
							});
						},
					} as Plugin)
				: null,
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

// @ts-expect-error
export const { default: Exec } = await import(
	"@playform/build/Target/Function/Exec.js"
);
