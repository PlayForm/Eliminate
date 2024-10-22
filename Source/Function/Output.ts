import type Interface from "@Interface/Output.js";
import type Initializer from "@Type/Output/Visit/Initializer.js";
import type { SourceFile } from "typescript";

/**
 * @module Output
 *
 */
export default (async (...[Source]) => {
	const Node = ts.createSourceFile(
		"temp.ts",
		Source,
		ts.ScriptTarget.Latest,
		true,
	);

	// const Usage: Record<string, number> = {};

	const Initializer: Initializer = new Map([]);

	// const Export = new Set<string>();

	(await import("@Function/Output/Visit.js")).default(Initializer)(Node);

	return ts
		.createPrinter()
		.printFile(
			ts.transform(Node, [
				(await import("@Function/Output/Transformer.js")).default,
			]).transformed[0] as SourceFile,
		);
}) satisfies Interface as Interface;

export const ts = await import("typescript");
