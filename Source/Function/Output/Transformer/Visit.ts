import type Interface from "@Interface/Output/Transformer/Visit.js";
import type { Node } from "typescript";

/**
 * @module Output
 *
 */
export const Fn = ((Usage, Initializer) =>
	(...[Context]) =>
	(...[Node]) => {
		Node = ts.visitEachChild(
			Node,
			Fn(Usage, Initializer)(Context),
			Context,
			// @ts-expect-error
			(nodes) => {
				return Array.isArray(nodes) ? nodes.reverse() : nodes;
			},
			// (nodes: NodeArray<Node> | undefined) => {
			// 	console.log(nodes instanceof Array);

			// 	return nodes;
			// },
		) as Node;

		// if (ts.isVariableStatement(Node)) {
		// 	// const declarations = Node.declarationList.declarations.filter(
		// 	// 	(Declaration) => {
		// 	// 		return (Usage.get(Declaration.name.getText()) ?? 0) > 1;
		// 	// 	},
		// 	// );
		// 	// if (declarations.length === 0) {
		// 	// 	return ts.factory.createEmptyStatement();
		// 	// }
		// 	// return ts.factory.updateVariableStatement(
		// 	// 	Node,
		// 	// 	Node.modifiers,
		// 	// 	ts.factory.updateVariableDeclarationList(
		// 	// 		Node.declarationList,
		// 	// 		declarations,
		// 	// 	),
		// 	// );
		// } else if (ts.isIdentifier(Node)) {
		// 	// const Name = Node.getText();
		// 	// if (
		// 	// 	typeof Usage.get(Name) !== "undefined" &&
		// 	// 	typeof Get(Name, Initializer) !== "undefined"
		// 	// ) {
		// 	// 	if (Usage.get(Name) === 1) {
		// 	// 		return Get(Name, Initializer);
		// 	// 	}
		// 	// }
		// }

		// if (ts.isIdentifier(Node)) {
		// 	const InitializerNode = Get(Node.getText(), Initializer);

		// 	if (InitializerNode && Usage.get(Node.getText()) === 0) {
		// 		// return InitializerNode;
		// 		// console.log(Node.escapedText);
		// 	}
		// }

		return Node;
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
