import type Interface from "@Interface/Output/Transformer.js";

/**
 * @module Output
 *
 */
export default ((Usage, Initializer) =>
	(...[Context]) =>
	(Node) =>
		ts.visitNode(
			Node,
			Visit(Usage, Initializer)(Context),
		)) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Visit } = await import(
	"@Function/Output/Transformer/Visit.js"
);
