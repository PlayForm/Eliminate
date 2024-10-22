import type Interface from "@Interface/Output/Visit.js";

/**
 * @module Output
 *
 */
export const Fn = ((...[Initializer]) =>
	(...[Node]) => {
		ts.forEachChild(Node, Fn(Initializer));

		if (ts.isVariableDeclaration(Node) && Node.initializer) {
			Initializer.set(Node.initializer.getText(), Node.name.getText());
		}

		console.log(Initializer);

		if (ts.isIdentifier(Node)) {
			// console.log(Initializer);
			// console.log(Node.getText());
		}

		// if (ts.isVariableDeclaration(node) && node.initializer) {
		// 	const name = node.name.getText();

		// 	variableUsageCount[name] = 0;

		// 	variableInitializers[name] = node.initializer;
		// } else if (ts.isIdentifier(node)) {
		// 	const name = node.getText();

		// 	if (typeof variableUsageCount[name] !== "undefined") {
		// 		variableUsageCount[name]++;
		// 	}
		// } else if (
		// 	(ts.isExportAssignment(node) || ts.isExportSpecifier(node))
		// ) {
		// 	exportedVariables.add(node.name?.getText() ?? "");
		// }
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export default Fn;
