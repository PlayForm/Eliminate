import type { BuildOptions } from "esbuild";

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
		// {
		// 	name: "Target",
		// 	setup({ onStart, initialOptions: { outdir } }) {
		// 		onStart(async () => {
		// 			try {
		// 				outdir
		// 					? await (
		// 							await import("fs/promises")
		// 						).rm(outdir, {
		// 							recursive: true,
		// 						})
		// 					: {};
		// 			} catch (_Error) {
		// 				console.log(_Error);
		// 			}
		// 		});
		// 	},
		// },
		{
			name: "Example",
			setup({ onEnd }) {
				onEnd(async () => {
					await Exec("pwd");
				});
			},
		},
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
