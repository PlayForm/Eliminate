import type Interface from "@Interface/Output/Transformer/Visit.js";
import {
	factory,
	isIdentifier,
	isMemberExpression,
	isPropertyAccessExpression,
	isVariableStatement,
	visitEachChild,
	type Node,
} from "typescript";

/**
 * @module Output
 *
 */
export const Fn = ((Usage, Initializer) =>
	(...[Context]) =>
	(...[Node]) => {
		const processNode = (node: Node): { node: Node; changed: boolean } => {
			let changed = false;
			let currentNode = node;

			// Handle variable declarations
			if (isVariableStatement(currentNode)) {
				const declarations = currentNode.declarationList.declarations;
				const newDeclarations = declarations.filter((decl) => {
					if (isIdentifier(decl.name)) {
						const usageCount = Usage.get(decl.name.text);
						return (
							!usageCount || usageCount > 1 || !decl.initializer
						);
					}
					return true;
				});

				if (newDeclarations.length === 0) {
					return {
						node: factory.createEmptyStatement(),
						changed: true,
					};
				}

				if (newDeclarations.length !== declarations.length) {
					currentNode = factory.updateVariableStatement(
						currentNode,
						currentNode.modifiers,
						factory.createVariableDeclarationList(
							newDeclarations,
							currentNode.declarationList.flags,
						),
					);
					changed = true;
				}
			}

			// Handle identifiers
			if (isIdentifier(currentNode)) {
				try {
					const nameNode = currentNode.text;
					const usageNode = Usage.get(nameNode);
					const initializerNode = Get(nameNode, Initializer);

					if (initializerNode && usageNode === 1) {
						// Check if we're in a property access expression
						const parent = currentNode.parent;
						if (
							isPropertyAccessExpression(parent) &&
							parent.name === currentNode
						) {
							// If we're the name part of a property access, keep as identifier
							return {
								node: currentNode,
								changed: false,
							};
						}

						// For other contexts, create appropriate expression
						if (isIdentifier(initializerNode)) {
							return {
								node: factory.createIdentifier(
									initializerNode.text,
								),
								changed: true,
							};
						} else {
							// Clone the initializer node to ensure proper context
							return {
								node: factory.cloneNode(initializerNode),
								changed: true,
							};
						}
					}
				} catch (error) {
					console.error(
						"Error during identifier replacement:",
						error,
					);
				}
			}

			// Process children
			const visitChildren = (
				parentNode: Node,
			): { node: Node; changed: boolean } => {
				let childrenChanged = false;
				const newNode = visitEachChild(
					parentNode,
					(child) => {
						const result = processNode(child);
						childrenChanged = childrenChanged || result.changed;
						return result.node;
					},
					Context,
				);
				return { node: newNode, changed: childrenChanged };
			};

			// Process current node's children first
			const { node: processedNode, changed: childrenChanged } =
				visitChildren(currentNode);

			return {
				node: processedNode,
				changed: changed || childrenChanged,
			};
		};

		// Keep processing until no more changes
		let currentNode = Node;
		let hasChanged = true;

		while (hasChanged) {
			const result = processNode(currentNode);
			if (!result.changed) {
				hasChanged = false;
			}
			currentNode = result.node;
		}

		return currentNode;

		// Node = ts.visitEachChild(
		// 	Node,
		// 	Fn(Usage, Initializer)(Context),
		// 	Context,
		// );

		// if (ts.isIdentifier(Node)) {
		// 	try {
		// 		const NameNode = Node.text;
		// 		const UsageNode = Usage.get(NameNode);
		// 		const InitializerNode = Get(NameNode, Initializer);

		// 		if (
		// 			typeof InitializerNode !== "undefined" &&
		// 			typeof UsageNode !== "undefined"
		// 		) {
		// 			if (ts.isCallExpression(Node.parent) && UsageNode === 1) {
		// 				return ts.factory.createIdentifier(
		// 					InitializerNode.getText(),
		// 				);
		// 			}
		// 		}
		// 	} catch (_Error) {
		// 		console.log(_Error);
		// 	}
		// }

		// return Node;
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
