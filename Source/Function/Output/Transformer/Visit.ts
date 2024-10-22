import type Interface from "@Interface/Output/Transformer/Visit.js";

/**
 * @module Output
 *
 */
export const Fn = ((...[Context]) =>
	(...[Node]) => {
		Node = ts.visitEachChild(Node, Fn(Context), Context);

		console.log("test 2");

		// if (ts.isVariableStatement(node)) {
		// 	const declarations =
		// 		node.declarationList.declarations.filter(
		// 			(declaration) => {
		// 				const name = declaration.name.getText();

		// 				if (
		// 					typeof variableUsageCount[name] !==
		// 					"undefined"
		// 				) {
		// 					return (
		// 						variableUsageCount[name] > 1 ||
		// 						exportedVariables.has(name)
		// 					);
		// 				} else {
		// 					return true;
		// 				}
		// 			},
		// 		);

		// 	if (declarations.length === 0) {
		// 		return ts.factory.createEmptyStatement();
		// 	}

		// 	return ts.factory.updateVariableStatement(
		// 		node,
		// 		node.modifiers,
		// 		ts.factory.updateVariableDeclarationList(
		// 			node.declarationList,
		// 			declarations,
		// 		),
		// 	);
		// } else if (ts.isIdentifier(node)) {
		// 	const name = node.getText();

		// 	if (typeof variableUsageCount[name] !== "undefined") {
		// 		if (
		// 			variableUsageCount[name] === 1 &&
		// 			variableInitializers[name] &&
		// 			!exportedVariables.has(name)
		// 		) {
		// 			return variableInitializers[name];
		// 		}
		// 	}
		// }

		return Node;
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export default Fn;
