import type Interface from "@Interface/Output/Visit.js";
import type { Node } from "typescript";

/**
 * @module Output
 * Gathers variable usage information and initializers
 */
export const Fn = ((...[Usage, Initializer]) =>
	(...[Node]) => {
		const MAX_USAGE_COUNT = 1000;

		const MAX_INITIALIZER_SIZE = 1000;

		const visitedNodes = new Set<string>();

		const ID = `${ts.SyntaxKind[Node.kind]}-${Node.pos}-${Node.end}`;

		if (visitedNodes.has(ID)) {
			console.warn("Warning: Circular reference detected", {
				TypeNode: ts.SyntaxKind[Node.kind],
				Position: Node.pos,
				Text: Node.getText?.(),
			});

			return;
		}

		visitedNodes.add(ID);

		ts.forEachChild(Node, Fn(Usage, Initializer));

		if (
			Usage.size >= MAX_USAGE_COUNT ||
			Initializer.size >= MAX_INITIALIZER_SIZE
		) {
			console.warn("Warning: Maximum map size reached", {
				UsageLength: Usage.size,
				InitializerLength: Initializer.size,
			});

			return;
		}

		if (ts.isVariableDeclaration(Node) && Node.initializer) {
			const NameNode = Node.name.getText();

			// Check for self-referential declarations
			const SelfReferential = (() => {
				let True = false;

				const Visit = (node: Node) => {
					if (ts.isIdentifier(node)) {
						if (
							node.text === NameNode &&
							!ts.isTemplateExpression(node.parent) &&
							!ts.isTemplateSpan(node.parent) &&
							!ts.isPropertyAccessExpression(node.parent)
						) {
							True = true;
						}
					}

					ts.forEachChild(node, Visit);
				};

				Visit(Node.initializer);

				return True;
			})();

			if (SelfReferential) {
				console.info(
					`Info: Skipping self-referential initializer for: ${NameNode}`,
					{
						TypeNode: ts.SyntaxKind[Node.kind],
						Position: Node.pos,
						Text: Node.getText?.(),
					},
				);

				return;
			}

			// Initialize usage count
			if (!Usage.has(NameNode) && Usage.size < MAX_USAGE_COUNT) {
				Usage.set(NameNode, 0);
			}

			// Store the initializer with the variable name
			if (Initializer.size < MAX_INITIALIZER_SIZE) {
				Initializer.set(Node.initializer, NameNode);
			}
		} else if (ts.isIdentifier(Node)) {
			const NameNode = Node.getText();

			// Only count usage if not part of a declaration
			if (!ts.isVariableDeclaration(Node.parent)) {
				const Count = Usage.get(NameNode) ?? 0;

				if (Count < MAX_USAGE_COUNT) {
					Usage.set(NameNode, Count + 1);
				} else {
					console.warn(
						`Warning: Maximum usage count reached for identifier: ${NameNode}`,
						{
							TypeNode: ts.SyntaxKind[Node.kind],
							Position: Node.pos,
							Text: Node.getText?.(),
						},
					);
				}
			}
		}
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export default Fn;
