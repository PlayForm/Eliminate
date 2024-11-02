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
							isPropertyAccessExpression(NodeParent) &&
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
				parentNode: Node,
			): { Node: Node; Use: boolean } => {
				let Use = false;

				const NodeNew = visitEachChild(
					parentNode,
					(child) => {
						const Output = Eliminate(child);

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

		while (Use) {
			const Output = Eliminate(NodeCurrent);

			if (!Output.Use) {
				Use = false;
			}

			NodeCurrent = Output.Node;
		}

		return NodeCurrent;
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
