import type Interface from "@Interface/Output/Transformer/Visit.js";
import type { Node } from "typescript";

/**
 * @module Output
 *
 */
export const Fn = ((Usage, Initializer) =>
	(...[Context]) =>
	(...[Node]) => {
		const _Visit = (
			Node: Node,
			Depth = 0,
		): { Node: Node; Use: boolean } => {
			const MAX_RECURSIVE_DEPTH = 100;
			const MAX_NODE_VISITS = 100;

			let Visit = 0;

			Visit++;

			if (Visit >= MAX_NODE_VISITS || Depth >= MAX_RECURSIVE_DEPTH) {
				return { Node, Use: false };
			}

			let Use = false;

			let NodeCurrent = Node;

			// Handle array literals that need to be converted to identifiers
			if (ts.isArrayLiteralExpression(NodeCurrent)) {
				const parent = NodeCurrent.parent;
				// If array literal is being used where an identifier is expected
				if (
					ts.isIdentifier(parent) ||
					ts.isPropertyAccessExpression(parent)
				) {
					return {
						Node: factory.createIdentifier("array_expression"),
						Use: true,
					};
				}
			}

			if (ts.isEmptyStatement(NodeCurrent)) {
				return {
					Node: factory.createNotEmittedStatement(NodeCurrent),
					Use: true,
				};
			}

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

			if (isIdentifier(NodeCurrent)) {
				try {
					const NodeName = NodeCurrent.text;

					const NodeUsage = Usage.get(NodeName);

					const NodeInitializer = Get(NodeName, Initializer);

					if (NodeInitializer && NodeUsage === 1) {
						const NodeParent = NodeCurrent.parent;

						// Fix the property access expression check
						if (ts.isPropertyAccessExpression(NodeParent)) {
							// Check if this identifier is the name part of the property access
							if (NodeParent.name.text === NodeCurrent.text) {
								return { Node: NodeCurrent, Use: false };
							}
						}

						// Handle property assignments
						if (ts.isPropertyAssignment(NodeParent)) {
							if (
								ts.isIdentifier(NodeParent.name) &&
								NodeParent.name.text === NodeCurrent.text
							) {
								return { Node: NodeCurrent, Use: false };
							}
						}

						if (isIdentifier(NodeInitializer)) {
							const newNode = factory.createIdentifier(
								NodeInitializer.text,
							);

							// Ensure we're not creating an invalid property access
							if (
								ts.isPropertyAccessExpression(NodeParent) ||
								ts.isPropertyAssignment(NodeParent)
							) {
								if (NodeParent.name === NodeCurrent) {
									return { Node: NodeCurrent, Use: false };
								}
							}

							return { Node: newNode, Use: true };
						}

						// Handle transformation more safely

						const transformed = ts.transform(NodeInitializer, [
							(_Context) => (node) => node,
						]).transformed[0];

						if (transformed) {
							const NodeParentNew = transformed.parent;

							// Ensure we don't return invalid member names
							if (ts.isPropertyAccessExpression(NodeParentNew)) {
								if (
									ts.isIdentifier(NodeParentNew.name) &&
									NodeParentNew.name.text === NodeCurrent.text
								) {
									return { Node: NodeCurrent, Use: false };
								}
							}
							return { Node: transformed as Node, Use: true };
						}
					}
				} catch (_Error) {
					console.error(
						"Error during identifier replacement:",
						_Error,
					);
				}
			}

			// Handle PropertyAccessExpression nodes
			if (ts.isPropertyAccessExpression(NodeCurrent)) {
				const parent = NodeCurrent.parent;
				if (ts.isPropertyAssignment(parent)) {
					// Convert to a safe identifier when used as property name
					return {
						Node: factory.createIdentifier(NodeCurrent.name.text),
						Use: true,
					};
				}
			}

			const { Node: NodeOutput, Use: UseChildren } = ((
				NodeParent: Node,
			): { Node: Node; Use: boolean } => {
				let Use = false;

				let Return = false;

				const NodeNew = ts.visitEachChild(
					NodeParent,
					(NodeChild) => {
						if (Return) {
							return NodeChild;
						}

						const Output = _Visit(NodeChild, Depth + 1);

						if (
							Output.Use === false &&
							Depth > MAX_RECURSIVE_DEPTH
						) {
							Return = true;

							return NodeChild;
						}

						Use = Use || Output.Use;

						return Output.Node;
					},
					Context,
				);

				return { Node: NodeNew, Use: Use };
			})(NodeCurrent);

			return {
				Node: NodeOutput,
				Use: Use || UseChildren,
			};
		};

		let NodeCurrent = Node;

		let Use = true;

		const MAX_ITERATIONS = 100;

		let Iteration = 0;

		while (Use && Iteration < MAX_ITERATIONS) {
			if (Iteration >= MAX_ITERATIONS) {
				console.warn(
					`Warning: Maximum iteration count (${MAX_ITERATIONS}) reached. Possible infinite loop detected.`,
					{
						TypeNode: ts.SyntaxKind[NodeCurrent.kind],
						Position: NodeCurrent.pos,
						Depth: "root",
					},
				);

				break;
			}

			const Output = _Visit(NodeCurrent);

			if (!Output.Use) {
				Use = false;
			}

			NodeCurrent = Output.Node;

			Iteration++;
		}

		return NodeCurrent;
	}) satisfies Interface as Interface;

export const {
	default: ts,
	isIdentifier,
	factory,
} = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
