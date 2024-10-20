import type Interface from "@Interface/Output/Transformer.js";

/**
 * @module Output
 *
 */
export default ((...[Context]) =>
	(Node) =>
		ts.visitNode(Node, Visit(Context))) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Visit } = await import(
	"@Function/Output/Transformer/Visit.js"
);
