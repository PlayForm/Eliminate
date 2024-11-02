import type Interface from "@Interface/Output.js";
import type Initializer from "@Type/Output/Visit/Initializer.js";
import type Usage from "@Type/Output/Visit/Usage.js";
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

	const Usage: Usage = new Map([]);

	const Initializer: Initializer = new Map([]);

	(await import("@Function/Output/Visit.js")).default(
		Usage,
		Initializer,
	)(Node);

	const Transformer = (
		await import("@Function/Output/Transformer.js")
	).default(Usage, Initializer);

	let Use = true;
	let NodeTransform = ts.transform(Node, [Transformer])
		.transformed[0] as SourceFile;

	while (Use) {
		const { transformed } = ts.transform(NodeTransform, [Transformer]);

		if (transformed[0] === NodeTransform) {
			Use = false;
		} else {
			NodeTransform = transformed[0] as SourceFile;
		}
	}

	return ts.createPrinter().printFile(NodeTransform);
}) satisfies Interface as Interface;

export const ts = await import("typescript");
