import type Interface from "@Interface/Output/Transformer/Visit.js";

/**
 * @module Output
 *
 */
export const Fn = ((Usage, Initializer) =>
	(...[Context]) =>
	(...[Node]) => {
		// Node = ;

		if (ts.isVariableStatement(Node)) {
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
			console.log(Node.getText());
		}

		if (ts.isIdentifier(Node)) {
			const NameNode = Node.getText();
			const UsageNode = Usage.get(NameNode);
			const InitializerNode = Get(NameNode, Initializer);

			if (
				typeof InitializerNode !== "undefined" &&
				typeof UsageNode !== "undefined"
			) {
				if (ts.isCallExpression(Node.parent) && UsageNode === 1) {
					return ts.factory.createIdentifier(
						InitializerNode.getText(),
					);
				}
			}
		}

		return ts.visitEachChild(
			Node,
			Fn(Usage, Initializer)(Context),
			Context,
		);
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
