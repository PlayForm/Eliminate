import type Interface from "@Interface/Output.js";
import type { SourceFile } from "typescript";

/**
 * @module Output
 *
 */
export default (async (...[Source]) =>
	ts
		.createPrinter({
			newLine: ts.NewLineKind.LineFeed,
			removeComments: false,
			omitTrailingSemicolon: false,
			noEmitHelpers: false,
		})
		.printFile(
			ts.transform(
				ts.createSourceFile(
					"temp.ts",
					Source,
					ts.ScriptTarget.Latest,
					true,
				),
				[(await import("@Function/Output/Transformer.js")).default],
			).transformed[0] as SourceFile,
		)) satisfies Interface as Interface;

export const ts = await import("typescript");
