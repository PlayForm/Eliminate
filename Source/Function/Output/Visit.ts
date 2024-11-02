import type Interface from "@Interface/Output/Visit.js";

/**
 * @module Output
 *
 */
export const Fn = ((...[Usage, Initializer]) =>
	(...[Node]) => {
		ts.forEachChild(Node, Fn(Usage, Initializer));

		if (ts.isVariableDeclaration(Node) && Node.initializer) {
			const NameNode = Node.name.getText();

			// Reset the usage, because of found initializer
			Usage.set(NameNode, 0);

			// Set the initializer
			Initializer.set(Node.initializer, NameNode);
		} else if (ts.isIdentifier(Node)) {
			const NameNode = Node.getText();

			// Increment if usage is found
			if (!ts.isVariableDeclaration(Node.parent)) {
				Usage.set(NameNode, (Usage.get(NameNode) ?? 0) + 1);
			}
		}
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export default Fn;
