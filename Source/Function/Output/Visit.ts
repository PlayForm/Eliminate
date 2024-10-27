import type Interface from "@Interface/Output/Visit.js";

/**
 * @module Output
 *
 */
export const Fn = ((...[Usage, Initializer]) =>
	(...[Node]) => {
		ts.forEachChild(Node, Fn(Usage, Initializer));

		if (ts.isVariableDeclaration(Node) && Node.initializer) {
			// Reset the usage, because of found initializer
			Usage.set(Node.name.getText(), 0);

			// Set the initializer
			Initializer.set(Node.initializer, Node.name.getText());
		} else if (ts.isIdentifier(Node)) {
			// Increment if usage is found
			Usage.set(Node.getText(), Usage.get(Node.getText()) ?? 0 + 1);
		}
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export default Fn;
