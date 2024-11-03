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

			if (Visit >= MAX_NODE_VISITS) {
				console.warn(
					`Warning: Maximum node visits (${MAX_NODE_VISITS}) reached for single Eliminate call`,
					{
						TypeNode: ts.SyntaxKind[Node.kind],
						Depth: Depth,
					},
				);

				return { Node, Use: false };
			}

			if (Depth >= MAX_RECURSIVE_DEPTH) {
				console.warn(
					`Warning: Maximum recursive depth (${MAX_RECURSIVE_DEPTH}) reached in Eliminate function.`,
					{
						TypeNode: ts.SyntaxKind[Node.kind],
						Position: Node.pos,
						Text: Node.getText?.(),
					},
				);

				return { Node, Use: false };
			}

			let Use = false;

			let NodeCurrent = Node;

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

						if (
							ts.isPropertyAccessExpression(NodeParent) &&
							NodeParent.name === NodeCurrent
						) {
							return {
								Node: NodeCurrent,
								Use: false,
							};
						}

						if (isIdentifier(NodeInitializer)) {
							return {
								Node: factory.createIdentifier(
									NodeInitializer.text,
								),
								Use: true,
							};
						}

						return {
							Node: ts.transform(NodeInitializer, [
								(_Context) => (node) => node,
							]).transformed[0] as Node,
							Use: true,
						};
					}
				} catch (_Error) {
					console.error(
						"Error during identifier replacement:",
						_Error,
					);
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
