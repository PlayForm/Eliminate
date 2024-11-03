import type Interface from "./Target/Interface/Option.js";

/**
 * @module Option
 *
 */
export default (await import("./Target/Function/Merge.js")).default(
	(await import("@playform/pipe/Target/Variable/Option.js")).default,
	{
		Action: {
			Wrote: async (On) => {
				try {
					return (
						await import("./Target/Function/Output.js")
					).default(On.Buffer.toString());
				} catch (_Error) {
					console.log(_Error);

					return On.Buffer;
				}
			},
		},
		Path: new Map([["./Example/Input", "./Example/Output"]]),
		File: "**/*.ts",
		Exclude: (File) =>
			// File.indexOf(".d.ts") !== -1 || !File.includes("promise.ts")
			File.indexOf(".d.ts") !== -1 ||
			!File.includes("workbench.web.main.internal.ts")
				? // File.indexOf(".d.ts") !== -1
					true
				: false,
	} satisfies Interface,
);
