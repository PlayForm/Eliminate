import type Interface from "@Interface/Output/Visit.js";

/**
 * @module Output
 * Gathers variable usage information and initializers
 */
export const Fn = ((...[Usage, Initializer]) =>
	(...[Node]) => {
		ts.forEachChild(Node, Fn(Usage, Initializer));

		if (ts.isVariableDeclaration(Node) && Node.initializer) {
			const NameNode = Node.name.getText();

			// Initialize usage count
			Usage.set(NameNode, 0);

			// Store the initializer with the variable name
			Initializer.set(Node.initializer, NameNode);
		} else if (ts.isIdentifier(Node)) {
			const NameNode = Node.getText();

			// Only count usage if not part of a declaration
			if (!ts.isVariableDeclaration(Node.parent)) {
				const Count = Usage.get(NameNode) ?? 0;

				Usage.set(NameNode, Count + 1);
			}
		}
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export default Fn;
