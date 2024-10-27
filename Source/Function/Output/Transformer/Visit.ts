import type Interface from "@Interface/Output/Transformer/Visit.js";

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
		);

		if (ts.isVariableStatement(Node)) {
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

			// if (NameNode === "nodePath") {
			// 	console.log("----------");
			// 	console.log(NameNode);
			// 	console.log(UsageNode);
			// 	console.log(Node.getFullText());
			// 	console.log(Node.parent.getFullText());
			// 	console.log(ts.isDeclarationStatement(Node));
			// 	console.log(ts.isVariableDeclaration(Node));
			// 	console.log(ts.isVariableStatement(Node));
			// }
		}

		return Node;
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
