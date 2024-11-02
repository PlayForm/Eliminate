import type Interface from "@Interface/Output/Transformer/Visit.js";
import {
	factory,
	isIdentifier,
	isPropertyAccessExpression,
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
		const Eliminate = (Node: Node): { Node: Node; Use: boolean } => {
			let Use = false;

			let NodeCurrent = Node;

			if (ts.isVariableStatement(NodeCurrent)) {
				const Declaration = NodeCurrent.declarationList.declarations;

				const DeclarationNew = Declaration.filter((Declaration) => {
					if (isIdentifier(Declaration.name)) {
						const Count = Usage.get(Declaration.name.text);

						return !Count || Count > 1 || !Declaration.initializer;
					}

					return true;
				});

				if (DeclarationNew.length === 0) {
					return {
						Node: factory.createEmptyStatement(),
						Use: true,
					};
				}

				if (DeclarationNew.length !== Declaration.length) {
					NodeCurrent = factory.updateVariableStatement(
						NodeCurrent,
						NodeCurrent.modifiers,
						factory.createVariableDeclarationList(
							DeclarationNew,
							NodeCurrent.declarationList.flags,
						),
					);

					Use = true;
				}
			}

			// Handle identifiers
			if (isIdentifier(NodeCurrent)) {
				try {
					const nameNode = NodeCurrent.text;

					const usageNode = Usage.get(nameNode);

					const initializerNode = Get(nameNode, Initializer);

					if (initializerNode && usageNode === 1) {
						// Check if we're in a property access expression
						const parent = NodeCurrent.parent;

						if (
							isPropertyAccessExpression(parent) &&
							parent.name === NodeCurrent
						) {
							// If we're the name part of a property access, keep as identifier
							return {
								Node: NodeCurrent,
								Use: false,
							};
						}

						// For identifiers, create new identifier
						if (isIdentifier(initializerNode)) {
							return {
								Node: factory.createIdentifier(
									initializerNode.text,
								),
								Use: true,
							};
						}

						// For expressions, preserve the node structure
						const updatedNode = ts.transform(initializerNode, [
							(_Context) => (node) => node,
						]).transformed[0];

						return {
							Node: updatedNode as Node,
							Use: true,
						};
					}
				} catch (error) {
					console.error(
						"Error during identifier replacement:",
						error,
					);
				}
			}

			const { Node: NodeProcessed, Use: UseChildren } = ((
				parentNode: Node,
			): { Node: Node; Use: boolean } => {
				let Use = false;

				const NodeNew = visitEachChild(
					parentNode,
					(child) => {
						const result = Eliminate(child);

						Use = Use || result.Use;

						return result.Node;
					},
					Context,
				);

				return { Node: NodeNew, Use: Use };
			})(NodeCurrent);

			return {
				Node: NodeProcessed,
				Use: Use || UseChildren,
			};
		};

		let NodeCurrent = Node;

		let Use = true;

		while (Use) {
			const Processed = Eliminate(NodeCurrent);

			if (!Processed.Use) {
				Use = false;
			}

			NodeCurrent = Processed.Node;
		}

		return NodeCurrent;
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
