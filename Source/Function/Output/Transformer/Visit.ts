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

		if (ts.isIdentifier(Node)) {
			const NameNode = Node.getText();
			const UsageNode = Usage.get(NameNode);
			const InitializerNode = Get(NameNode, Initializer);

			if (
				typeof UsageNode !== "undefined" &&
				typeof InitializerNode !== "undefined" &&
				UsageNode === 0
			) {
				return ts.factory.createIdentifier(InitializerNode.getText());
			}
		}

		return Node;
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
